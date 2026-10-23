import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");
    const serviceId = searchParams.get("serviceId");
    const ratingFilter = searchParams.get("rating");
    const query = searchParams.get("q") || "";

    const where: Record<string, unknown> = {};

    if (sellerId && sellerId !== "ALL") {
      where.service = { shopId: parseInt(sellerId, 10) };
    }

    if (serviceId && serviceId !== "ALL") {
      where.serviceId = parseInt(serviceId, 10);
    }

    if (ratingFilter && ratingFilter !== "ALL") {
      where.rating = parseInt(ratingFilter, 10);
    }

    if (query) {
      where.OR = [
        { comment: { contains: query } },
        { customer: { fullName: { contains: query } } },
        { service: { title: { contains: query } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true, image: true },
        },
        service: {
          select: {
            id: true,
            title: true,
            images: true,
            shop: {
              select: { id: true, name: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
            scheduledDate: true,
            totalPrice: true,
          },
        },
      },
    });

    const formattedReviews = reviews.map((r) => {
      let serviceImg = "";
      try {
        if (typeof r.service.images === "string") {
          const parsed = JSON.parse(r.service.images);
          serviceImg = Array.isArray(parsed) ? parsed[0] : parsed;
        } else if (Array.isArray(r.service.images)) {
          serviceImg = (r.service.images as string[])[0] || "";
        }
      } catch {
        serviceImg = "";
      }

      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment || "Đánh giá không có lời bình",
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        createdAt: r.createdAt.toISOString(),
        customer: {
          id: r.customer.id,
          fullName: r.customer.fullName || "Khách hàng",
          phone: r.customer.phone,
          email: r.customer.email,
          image: r.customer.image,
        },
        service: {
          id: r.service.id,
          title: r.service.title,
          image: serviceImg,
          shopId: r.service.shop.id,
          shopName: r.service.shop.name,
        },
        booking: {
          id: r.booking.id,
          bookingCode: r.booking.bookingCode,
          scheduledDate: r.booking.scheduledDate.toISOString(),
          totalPrice: Number(r.booking.totalPrice),
        },
        // Phân loại cảm xúc theo khía cạnh (Aspect-Based Sentiment Analysis)
        // Tạm thời để trống theo yêu cầu người dùng, cho phép tích hợp AI/Aspect model
        aspectSentiments: [],
      };
    });

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");
    if (!reviewId) {
      return NextResponse.json({ success: false, message: "Thiếu ID đánh giá" }, { status: 400 });
    }

    await prisma.review.delete({
      where: { id: parseInt(reviewId, 10) },
    });

    return NextResponse.json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
