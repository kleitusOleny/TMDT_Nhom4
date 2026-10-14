import { NextRequest, NextResponse } from "next/server";
import {
  generateDailyStats,
  initialBookings,
  initialServices,
  initialUsers,
} from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date();
    const defaultTo = today.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Mặc định 7 ngày trước
    const defaultFromDate = new Date();
    defaultFromDate.setDate(defaultFromDate.getDate() - 6);
    const defaultFrom = defaultFromDate.toISOString().split("T")[0];

    const from = searchParams.get("from") || defaultFrom;
    const to = searchParams.get("to") || defaultTo;

    // 1. Dữ liệu biểu đồ cột theo mốc thời gian lọc
    const columnChartData = generateDailyStats(from, to);

    // Tính toán KPI trong khoảng thời gian đã lọc
    const totalRevenue = columnChartData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const platformFee = columnChartData.reduce((sum, d) => sum + d.platformFee, 0);
    const totalOrders = columnChartData.reduce((sum, d) => sum + d.orderCount, 0);

    // 2. Dữ liệu biểu đồ tròn: Phân bổ trạng thái đơn hàng (Donut Status)
    const statusCounts = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    initialBookings.forEach((b) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const totalAllBookings = initialBookings.length || 1;

    const donutStatusData = [
      {
        name: "Hoàn tất",
        key: "COMPLETED",
        count: statusCounts.COMPLETED,
        percentage: Math.round((statusCounts.COMPLETED / totalAllBookings) * 100),
        color: "#10b981", // Emerald-500
      },
      {
        name: "Đang dọn dẹp",
        key: "IN_PROGRESS",
        count: statusCounts.IN_PROGRESS,
        percentage: Math.round((statusCounts.IN_PROGRESS / totalAllBookings) * 100),
        color: "#3b82f6", // Blue-500
      },
      {
        name: "Đã xác nhận",
        key: "CONFIRMED",
        count: statusCounts.CONFIRMED,
        percentage: Math.round((statusCounts.CONFIRMED / totalAllBookings) * 100),
        color: "#8b5cf6", // Purple-500
      },
      {
        name: "Chờ duyệt",
        key: "PENDING",
        count: statusCounts.PENDING,
        percentage: Math.round((statusCounts.PENDING / totalAllBookings) * 100),
        color: "#f59e0b", // Amber-500
      },
      {
        name: "Đã hủy",
        key: "CANCELLED",
        count: statusCounts.CANCELLED,
        percentage: Math.round((statusCounts.CANCELLED / totalAllBookings) * 100),
        color: "#f43f5e", // Rose-500
      },
    ];

    // 3. Dữ liệu biểu đồ tròn: Phân bổ doanh thu theo Danh mục dịch vụ (Donut Category)
    const categoryRevenueMap: Record<string, number> = {};
    initialBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        categoryRevenueMap[b.category] = (categoryRevenueMap[b.category] || 0) + b.totalAmount;
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

    // 4. Dữ liệu biểu đồ tròn: Phân bổ phương thức thanh toán (Donut Payment)
    const paymentMap: Record<string, number> = {};
    initialBookings.forEach((b) => {
      paymentMap[b.paymentMethod] = (paymentMap[b.paymentMethod] || 0) + 1;
    });
    const paymentLabels: Record<string, { label: string; color: string }> = {
      VNPAY: { label: "Cổng VNPAY", color: "#0284c7" },
      MOMO: { label: "Ví MoMo", color: "#d946ef" },
      QR_BANKING: { label: "Chuyển khoản QR", color: "#10b981" },
      CASH: { label: "Tiền mặt (COD)", color: "#f59e0b" },
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

    // 5. Top Dịch vụ và Top Đối tác
    const topServices = initialServices
      .slice()
      .sort((a, b) => b.completedBookings - a.completedBookings)
      .slice(0, 4);

    const sellers = initialUsers.filter((u) => u.role === "SELLER");

    return NextResponse.json({
      success: true,
      timeRange: { from, to },
      kpi: {
        totalRevenue,
        platformFee,
        sellerEarnings: totalRevenue - platformFee,
        totalOrders,
        completedRate: Math.round(
          ((statusCounts.COMPLETED + statusCounts.IN_PROGRESS) / totalAllBookings) * 100
        ),
        totalUsers: initialUsers.length,
        totalSellers: sellers.length,
      },
      charts: {
        columnChartData,
        donutStatusData,
        donutCategoryData,
        donutPaymentData,
      },
      topServices,
      topSellers: sellers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
