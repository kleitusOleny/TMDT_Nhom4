import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("category")?.trim() || "";
    const shopSlug = searchParams.get("shop")?.trim() || searchParams.get("provider")?.trim() || "";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const rating = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;
    const sortBy = searchParams.get("sortBy") || "newest"; // "newest", "price_asc", "price_desc", "rating"

    // Xây dựng điều kiện lọc linh hoạt
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { shop: { name: { contains: search } } },
      ];
    }

    if (categorySlug && categorySlug !== "all") {
      where.categories = {
        some: {
          slug: categorySlug,
        },
      };
    }

    if (shopSlug && shopSlug !== "all") {
      where.shop = {
        slug: shopSlug,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceStart = {};
      if (minPrice !== undefined && !isNaN(minPrice)) {
        (where.priceStart as Record<string, unknown>).gte = minPrice;
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        (where.priceStart as Record<string, unknown>).lte = maxPrice;
      }
    }

    if (rating !== undefined && !isNaN(rating) && rating > 0) {
      where.rating = {
        gte: rating,
      };
    }

    // Sắp xếp
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sortBy === "price_asc") {
      orderBy = { priceStart: "asc" };
    } else if (sortBy === "price_desc") {
      orderBy = { priceStart: "desc" };
    } else if (sortBy === "rating") {
      orderBy = { rating: "desc" };
    }

    // Lấy song song danh sách dịch vụ, danh mục và nhà cung cấp để làm bộ lọc
    const [services, categories, shops] = await Promise.all([
      prisma.dichVu.findMany({
        where,
        orderBy,
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
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { services: true },
          },
        },
      }),
      prisma.shop.findMany({
        where: { approvalStatus: "APPROVED" },
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
        orderBy: { name: "asc" },
      }),
    ]);

    // Tính toán số sao trung bình và số lượng đánh giá dựa trên count thực tế
    const formattedServices = services.map((s) => {
      const reviewList = s.reviews || [];
      const reviewCount = reviewList.length;
      let averageRating = s.rating;

      if (reviewCount > 0) {
        const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
        averageRating = Number((sum / reviewCount).toFixed(1));
      }

      // Loại bỏ mảng reviews lớn khỏi response payload để tối ưu băng thông
      const { reviews: _reviews, ...serviceData } = s;
      void _reviews;

      return {
        ...serviceData,
        rating: averageRating,
        totalReviews: reviewCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        categories,
        shops,
        total: formattedServices.length,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi server";
    console.error("List services API error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể lấy danh sách dịch vụ", error: errMessage },
      { status: 500 }
    );
  }
}
