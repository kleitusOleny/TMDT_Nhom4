import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const [featuredServices, categories, topShops, totalServicesCount] = await Promise.all([
      // Lấy danh sách dịch vụ nổi bật thực tế từ DB
      prisma.dichVu.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { rating: "desc" },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              approvalStatus: true,
              rating: true,
              area: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      // Danh mục dịch vụ thực tế từ DB
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: { services: true },
          },
        },
      }),

      // Các đối tác uy tín thực tế từ DB
      prisma.shop.findMany({
        where: { approvalStatus: "APPROVED" },
        take: 4,
        orderBy: { totalReviews: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          rating: true,
          totalReviews: true,
          area: true,
          _count: {
            select: { services: true },
          },
        },
      }),

      prisma.dichVu.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        featuredServices,
        categories,
        topShops,
        stats: {
          servicesCount: totalServicesCount,
          customersCount: "10,000+",
          partnersCount: "500+",
          ordersCount: "50,000+",
        },
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi server";
    console.error("Home data API error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể lấy dữ liệu trang chủ", error: errMessage },
      { status: 500 }
    );
  }
}
