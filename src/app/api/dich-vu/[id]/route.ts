import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dichVuId = parseInt(id, 10);

    if (isNaN(dichVuId)) {
      return NextResponse.json(
        { success: false, message: "ID dịch vụ không hợp lệ" },
        { status: 400 }
      );
    }

    const dichVu = await prisma.dichVu.findUnique({
      where: { id: dichVuId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            approvalStatus: true,
            rating: true,
            totalReviews: true,
            area: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            images: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!dichVu) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dịch vụ" },
        { status: 404 }
      );
    }

    // Tính toán số sao trung bình và số lượng đánh giá thực tế
    const reviewsList = dichVu.reviews || [];
    const reviewCount = reviewsList.length;
    let averageRating = dichVu.rating; // fallback nếu chưa có review nào

    if (reviewCount > 0) {
      const sumRating = reviewsList.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Number((sumRating / reviewCount).toFixed(1));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dichVu,
        rating: averageRating,
        totalReviews: reviewCount,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json(
      { success: false, message: "Không thể lấy thông tin dịch vụ", error: errMessage },
      { status: 500 }
    );
  }
}
