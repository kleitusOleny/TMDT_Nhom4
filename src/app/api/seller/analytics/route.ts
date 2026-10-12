import { NextRequest, NextResponse } from "next/server";
import {
  generateDailyStats,
  initialBookings,
  initialServices,
} from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = parseInt(searchParams.get("sellerId") || "2", 10); // Mặc định đối tác CleanPro (id: 2)

    const today = new Date();
    const defaultTo = today.toISOString().split("T")[0];
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - 6);
    const defaultFrom = defaultFromDate.toISOString().split("T")[0];

    const from = searchParams.get("from") || defaultFrom;
    const to = searchParams.get("to") || defaultTo;

    // 1. Biểu đồ cột doanh thu riêng của người bán theo khoảng ngày
    const columnChartData = generateDailyStats(from, to, sellerId);

    // Tính toán KPI của riêng shop
    const totalGrossRevenue = columnChartData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalPlatformFee = columnChartData.reduce((sum, d) => sum + d.platformFee, 0);
    const totalNetEarnings = columnChartData.reduce((sum, d) => sum + d.sellerRevenue, 0);
    const totalOrders = columnChartData.reduce((sum, d) => sum + d.orderCount, 0);

    // Lọc các đơn hàng của riêng shop này
    const myBookings = initialBookings.filter((b) => b.sellerId === sellerId);
    const myServices = initialServices.filter((s) => s.sellerId === sellerId);

    const statusCounts = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    myBookings.forEach((b) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const totalShopOrders = myBookings.length || 1;

    // Biểu đồ tròn trạng thái đơn của shop
    const donutStatusData = [
      {
        name: "Hoàn tất",
        count: statusCounts.COMPLETED,
        percentage: Math.round((statusCounts.COMPLETED / totalShopOrders) * 100),
        color: "#10b981",
      },
      {
        name: "Đang dọn dẹp",
        count: statusCounts.IN_PROGRESS,
        percentage: Math.round((statusCounts.IN_PROGRESS / totalShopOrders) * 100),
        color: "#3b82f6",
      },
      {
        name: "Đã xác nhận",
        count: statusCounts.CONFIRMED,
        percentage: Math.round((statusCounts.CONFIRMED / totalShopOrders) * 100),
        color: "#8b5cf6",
      },
      {
        name: "Chờ duyệt",
        count: statusCounts.PENDING,
        percentage: Math.round((statusCounts.PENDING / totalShopOrders) * 100),
        color: "#f59e0b",
      },
      {
        name: "Đã hủy",
        count: statusCounts.CANCELLED,
        percentage: Math.round((statusCounts.CANCELLED / totalShopOrders) * 100),
        color: "#f43f5e",
      },
    ];

    // Biểu đồ tròn phân bổ dịch vụ của shop
    const myCategoryMap: Record<string, number> = {};
    myBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        myCategoryMap[b.serviceName] = (myCategoryMap[b.serviceName] || 0) + b.sellerEarnings;
      }
    });

    const categoryColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#10b981"];
    const totalCategoryRev = Object.values(myCategoryMap).reduce((a, b) => a + b, 0) || 1;
    const donutServiceData = Object.entries(myCategoryMap).map(([service, rev], idx) => ({
      name: service,
      revenue: rev,
      percentage: Math.round((rev / totalCategoryRev) * 100),
      color: categoryColors[idx % categoryColors.length],
    }));

    return NextResponse.json({
      success: true,
      sellerId,
      timeRange: { from, to },
      kpi: {
        totalGrossRevenue,
        totalPlatformFee,
        totalNetEarnings,
        totalOrders,
        walletBalance: 12450000, // Ví tiền khả dụng có thể rút
        activeServicesCount: myServices.length,
        averageRating: 4.85,
      },
      charts: {
        columnChartData,
        donutStatusData,
        donutServiceData,
      },
      services: myServices,
      recentBookings: myBookings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
