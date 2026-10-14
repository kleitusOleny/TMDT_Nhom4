import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { BookingStatus, Role } from "@/src/generated/prisma/client";
import { DailyRevenueRecord } from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date();
    const defaultTo = today.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Mặc định 7 ngày trước
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - 6);
    const defaultFrom = defaultFromDate.toISOString().split("T")[0];

    const fromStr = searchParams.get("from") || defaultFrom;
    const toStr = searchParams.get("to") || defaultTo;

    const fromDate = new Date(`${fromStr}T00:00:00.000Z`);
    const toDate = new Date(`${toStr}T23:59:59.999Z`);

    // Lấy toàn bộ đơn hàng trong cơ sở dữ liệu
    const [allBookings, rangeBookings, totalUsersCount, totalSellersCount, topServicesDb] = await Promise.all([
      // Tất cả đơn hàng (để vẽ Donut status & payment)
      prisma.booking.findMany({
        include: {
          service: {
            include: {
              categories: { select: { name: true }, take: 1 },
              shop: { select: { id: true, name: true } },
            },
          },
          payment: { select: { method: true, status: true } },
        },
      }),

      // Đơn hàng nằm trong khoảng ngày được chọn (để vẽ biểu đồ cột theo ngày)
      prisma.booking.findMany({
        where: {
          scheduledDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        include: {
          service: {
            include: {
              categories: { select: { name: true }, take: 1 },
              shop: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { scheduledDate: "asc" },
      }),

      // Tổng số người dùng thực tế
      prisma.user.count(),

      // Tổng số nhà cung cấp (Shop hoặc PROVIDER)
      prisma.shop.count(),

      // Top dịch vụ thực tế
      prisma.dichVu.findMany({
        where: { isActive: true },
        take: 4,
        orderBy: { rating: "desc" },
        include: {
          shop: { select: { id: true, name: true } },
          categories: { select: { name: true, slug: true }, take: 1 },
          _count: { select: { bookings: true } },
        },
      }),
    ]);

    // 1. Tạo biểu đồ cột theo từng ngày trong khoảng from -> to
    const dailyMap: Record<string, DailyRevenueRecord> = {};
    const curDate = new Date(fromDate);
    while (curDate <= toDate) {
      const dStr = curDate.toISOString().split("T")[0];
      const parts = dStr.split("-");
      dailyMap[dStr] = {
        date: dStr,
        formattedDate: `${parts[2]}/${parts[1]}`,
        totalRevenue: 0,
        platformFee: 0,
        sellerRevenue: 0,
        orderCount: 0,
      };
      curDate.setDate(curDate.getDate() + 1);
    }

    rangeBookings.forEach((b) => {
      const dStr = new Date(b.scheduledDate).toISOString().split("T")[0];
      if (dailyMap[dStr]) {
        const amt = Number(b.totalPrice);
        const fee = Math.round(amt * 0.15); // Phí sàn 15%
        dailyMap[dStr].totalRevenue += amt;
        dailyMap[dStr].platformFee += fee;
        dailyMap[dStr].sellerRevenue += amt - fee;
        dailyMap[dStr].orderCount += 1;
      }
    });

    const columnChartData = Object.values(dailyMap);

    // Tính toán KPI trong khoảng thời gian
    const totalRevenue = columnChartData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const platformFee = columnChartData.reduce((sum, d) => sum + d.platformFee, 0);
    const totalOrders = columnChartData.reduce((sum, d) => sum + d.orderCount, 0);

    // 2. Phân bổ trạng thái đơn hàng (Donut Status)
    const statusCounts: Record<BookingStatus, number> = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    allBookings.forEach((b) => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status] += 1;
      }
    });

    const totalAllBookings = allBookings.length || 1;

    const donutStatusData = [
      {
        name: "Hoàn tất",
        key: "COMPLETED",
        count: statusCounts.COMPLETED,
        percentage: Math.round((statusCounts.COMPLETED / totalAllBookings) * 100),
        color: "#10b981",
      },
      {
        name: "Đang dọn dẹp",
        key: "IN_PROGRESS",
        count: statusCounts.IN_PROGRESS,
        percentage: Math.round((statusCounts.IN_PROGRESS / totalAllBookings) * 100),
        color: "#3b82f6",
      },
      {
        name: "Đã xác nhận",
        key: "CONFIRMED",
        count: statusCounts.CONFIRMED,
        percentage: Math.round((statusCounts.CONFIRMED / totalAllBookings) * 100),
        color: "#8b5cf6",
      },
      {
        name: "Chờ duyệt",
        key: "PENDING",
        count: statusCounts.PENDING,
        percentage: Math.round((statusCounts.PENDING / totalAllBookings) * 100),
        color: "#f59e0b",
      },
      {
        name: "Đã hủy",
        key: "CANCELLED",
        count: statusCounts.CANCELLED,
        percentage: Math.round((statusCounts.CANCELLED / totalAllBookings) * 100),
        color: "#f43f5e",
      },
    ];

    // 3. Phân bổ doanh thu theo Danh mục dịch vụ (Donut Category)
    const categoryRevenueMap: Record<string, number> = {};
    allBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        const catName = b.service.categories[0]?.name || "Khác";
        categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + Number(b.totalPrice);
      }
    });

    const categoryTotal = Object.values(categoryRevenueMap).reduce((a, b) => a + b, 0) || 1;
    const categoryColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];
    const donutCategoryData = Object.entries(categoryRevenueMap).map(([category, rev], index) => ({
      name: category,
      revenue: rev,
      percentage: Math.round((rev / categoryTotal) * 100),
      color: categoryColors[index % categoryColors.length],
    }));

    // 4. Phân bổ phương thức thanh toán (Donut Payment)
    const paymentMap: Record<string, number> = {};
    allBookings.forEach((b) => {
      const method = b.payment?.method || "CASH";
      paymentMap[method] = (paymentMap[method] || 0) + 1;
    });

    const paymentLabels: Record<string, { label: string; color: string }> = {
      VNPAY: { label: "Cổng VNPAY", color: "#0284c7" },
      MOMO: { label: "Ví MoMo", color: "#d946ef" },
      BANK_TRANSFER: { label: "Chuyển khoản QR", color: "#10b981" },
      CASH: { label: "Tiền mặt (COD)", color: "#f59e0b" },
      CREDIT_CARD: { label: "Thẻ quốc tế", color: "#6366f1" },
    };

    const donutPaymentData = Object.entries(paymentMap).map(([method, count]) => {
      const info = paymentLabels[method] || { label: method, color: "#64748b" };
      return {
        name: info.label,
        count,
        percentage: Math.round((count / totalAllBookings) * 100),
        color: info.color,
      };
    });

    // 5. Top Dịch vụ và Top Đối tác từ Database
    const topServices = topServicesDb.map((s) => ({
      id: s.id,
      name: s.title,
      category: s.categories[0]?.slug || "home",
      categoryName: s.categories[0]?.name || "Vệ sinh",
      sellerId: s.shop.id,
      sellerName: s.shop.name,
      price: Number(s.priceStart),
      unit: s.duration || "gói",
      status: s.isActive ? "APPROVED" : "INACTIVE",
      rating: s.rating,
      completedBookings: s._count.bookings,
    }));

    // Lấy các shop đã duyệt
    const approvedShops = await prisma.shop.findMany({
      where: { approvalStatus: "APPROVED" },
      select: {
        id: true,
        name: true,
        rating: true,
        totalReviews: true,
        owner: { select: { fullName: true, phone: true, email: true } },
      },
      take: 5,
    });

    const topSellers = approvedShops.map((sh) => ({
      id: sh.id,
      fullName: sh.owner.fullName || "Chủ cửa hàng",
      phone: sh.owner.phone || "---",
      email: sh.owner.email,
      role: Role.PROVIDER,
      status: "ACTIVE",
      sellerName: sh.name,
      rating: sh.rating,
      totalReviews: sh.totalReviews,
    }));

    return NextResponse.json({
      success: true,
      timeRange: { from: fromStr, to: toStr },
      kpi: {
        totalRevenue,
        platformFee,
        sellerEarnings: totalRevenue - platformFee,
        totalOrders,
        completedRate: Math.round(
          ((statusCounts.COMPLETED + statusCounts.IN_PROGRESS) / totalAllBookings) * 100
        ),
        totalUsers: totalUsersCount,
        totalSellers: totalSellersCount,
      },
      charts: {
        columnChartData,
        donutStatusData,
        donutCategoryData: donutCategoryData.length > 0 ? donutCategoryData : [
          { name: "Chưa có dữ liệu", revenue: 0, percentage: 100, color: "#cbd5e1" },
        ],
        donutPaymentData: donutPaymentData.length > 0 ? donutPaymentData : [
          { name: "Tiền mặt (COD)", count: 1, percentage: 100, color: "#f59e0b" },
        ],
      },
      topServices,
      topSellers,
      shops: approvedShops.map((sh) => ({ id: sh.id, name: sh.name })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
