import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = parseInt(searchParams.get("sellerId") || "1", 10);

    const today = new Date();
    const defaultTo = today.toISOString().split("T")[0];
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - 6);
    const defaultFrom = defaultFromDate.toISOString().split("T")[0];

    const fromStr = searchParams.get("from") || defaultFrom;
    const toStr = searchParams.get("to") || defaultTo;

    const fromDate = new Date(`${fromStr}T00:00:00.000Z`);
    const toDate = new Date(`${toStr}T23:59:59.999Z`);

    // 1. Lấy thông tin Shop và Dịch vụ của shop
    const shop = await prisma.shop.findUnique({
      where: { id: sellerId },
      include: {
        services: {
          include: {
            categories: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
      },
    });

    // 2. Lấy toàn bộ đơn hàng của Shop trong khoảng thời gian lọc
    const bookings = await prisma.booking.findMany({
      where: {
        service: {
          shopId: sellerId,
        },
        scheduledDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        service: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        payment: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    // 3. Gom nhóm dữ liệu theo ngày cho Biểu đồ cột
    const dateMap = new Map<
      string,
      { totalRevenue: number; platformFee: number; sellerRevenue: number; orderCount: number }
    >();

    // Khởi tạo các mốc ngày trong khoảng [fromDate, toDate]
    const curDate = new Date(fromDate);
    while (curDate <= toDate) {
      const dateKey = curDate.toISOString().split("T")[0];
      dateMap.set(dateKey, {
        totalRevenue: 0,
        platformFee: 0,
        sellerRevenue: 0,
        orderCount: 0,
      });
      curDate.setDate(curDate.getDate() + 1);
    }

    for (const b of bookings) {
      const dateKey = b.scheduledDate.toISOString().split("T")[0];
      const entry = dateMap.get(dateKey) || {
        totalRevenue: 0,
        platformFee: 0,
        sellerRevenue: 0,
        orderCount: 0,
      };

      entry.orderCount += 1;
      if (b.status !== "CANCELLED") {
        const rev = Number(b.totalPrice);
        const fee = Math.round(rev * 0.15); // Chiết khấu nền tảng 15%
        const sellerRev = rev - fee; // Thu nhập thực nhận 85%
        entry.totalRevenue += rev;
        entry.platformFee += fee;
        entry.sellerRevenue += sellerRev;
      }
      dateMap.set(dateKey, entry);
    }

    const columnChartData = Array.from(dateMap.entries()).map(([date, d]) => ({
      date,
      totalRevenue: d.totalRevenue,
      platformFee: d.platformFee,
      sellerRevenue: d.sellerRevenue,
      orderCount: d.orderCount,
    }));

    // Tính toán KPI
    const totalGrossRevenue = columnChartData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalPlatformFee = columnChartData.reduce((sum, d) => sum + d.platformFee, 0);
    const totalNetEarnings = columnChartData.reduce((sum, d) => sum + d.sellerRevenue, 0);
    const totalOrders = columnChartData.reduce((sum, d) => sum + d.orderCount, 0);

    // 4. Lấy tất cả đơn hàng lịch sử của Shop để tính phân bổ trạng thái và dịch vụ
    const allShopBookings = await prisma.booking.findMany({
      where: {
        service: {
          shopId: sellerId,
        },
      },
      include: {
        service: true,
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const statusCounts = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    allShopBookings.forEach((b) => {
      if (statusCounts[b.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[b.status as keyof typeof statusCounts] += 1;
      }
    });

    const totalAllShopBookings = allShopBookings.length || 1;

    // Biểu đồ tròn trạng thái đơn của shop
    const donutStatusData = [
      {
        name: "Hoàn tất",
        count: statusCounts.COMPLETED,
        percentage: Math.round((statusCounts.COMPLETED / totalAllShopBookings) * 100),
        color: "#10b981",
      },
      {
        name: "Đang dọn dẹp",
        count: statusCounts.IN_PROGRESS,
        percentage: Math.round((statusCounts.IN_PROGRESS / totalAllShopBookings) * 100),
        color: "#3b82f6",
      },
      {
        name: "Đã xác nhận",
        count: statusCounts.CONFIRMED,
        percentage: Math.round((statusCounts.CONFIRMED / totalAllShopBookings) * 100),
        color: "#8b5cf6",
      },
      {
        name: "Chờ duyệt",
        count: statusCounts.PENDING,
        percentage: Math.round((statusCounts.PENDING / totalAllShopBookings) * 100),
        color: "#f59e0b",
      },
      {
        name: "Đã hủy",
        count: statusCounts.CANCELLED,
        percentage: Math.round((statusCounts.CANCELLED / totalAllShopBookings) * 100),
        color: "#f43f5e",
      },
    ];

    // Biểu đồ tròn phân bổ doanh thu theo dịch vụ của shop
    const serviceRevMap: Record<string, number> = {};
    allShopBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        const title = b.service.title;
        const rev = Number(b.totalPrice);
        const sellerEarnings = Math.round(rev * 0.85);
        serviceRevMap[title] = (serviceRevMap[title] || 0) + sellerEarnings;
      }
    });

    const serviceColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];
    const totalServiceEarnings = Object.values(serviceRevMap).reduce((a, b) => a + b, 0) || 1;
    const donutServiceData = Object.entries(serviceRevMap).map(([title, earnings], idx) => ({
      name: title,
      revenue: earnings,
      percentage: Math.round((earnings / totalServiceEarnings) * 100),
      color: serviceColors[idx % serviceColors.length],
    }));

    // Chuẩn bị danh sách dịch vụ của shop
    const myServices = (shop?.services || []).map((s) => ({
      id: s.id,
      name: s.title,
      category: s.categories[0]?.slug || "home",
      categoryName: s.categories[0]?.name || "Vệ sinh",
      sellerId: sellerId,
      sellerName: shop?.name || "Shop",
      price: Number(s.priceStart),
      unit: s.duration || "gói",
      status: s.isActive ? "APPROVED" : "INACTIVE",
      rating: s.rating,
      completedBookings: s._count.bookings,
    }));

    // Chuẩn bị danh sách đơn hàng gần đây
    const recentBookings = allShopBookings.slice(0, 10).map((b) => {
      const rev = Number(b.totalPrice);
      const fee = Math.round(rev * 0.15);
      return {
        id: b.id,
        bookingCode: b.bookingCode,
        customerName: b.customer?.fullName || "Khách hàng",
        customerPhone: b.customer?.phone || "---",
        serviceName: b.service.title,
        sellerId: sellerId,
        sellerName: shop?.name || "Shop",
        bookingDate: b.scheduledDate.toISOString().split("T")[0],
        bookingTime: b.scheduledDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: b.status,
        totalAmount: rev,
        platformFee: fee,
        sellerEarnings: rev - fee,
        address: b.address,
        paymentStatus: b.status === "COMPLETED" ? "PAID" : "PENDING",
      };
    });

    return NextResponse.json({
      success: true,
      sellerId,
      shopName: shop?.name || "Đối tác",
      timeRange: { from: fromStr, to: toStr },
      kpi: {
        totalGrossRevenue,
        totalPlatformFee,
        totalNetEarnings,
        totalOrders,
        walletBalance: totalNetEarnings, // Số dư khả dụng
        activeServicesCount: myServices.length,
        averageRating: shop?.rating || 5.0,
      },
      charts: {
        columnChartData,
        donutStatusData,
        donutServiceData: donutServiceData.length > 0 ? donutServiceData : [
          { name: "Chưa có đơn", revenue: 0, percentage: 100, color: "#cbd5e1" }
        ],
      },
      services: myServices,
      recentBookings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
