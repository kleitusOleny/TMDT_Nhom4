import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

async function getAuthenticatedUserId(req: NextRequest): Promise<number | null> {
  const sessionCookie = req.cookies.get("cleanmate_session")?.value;
  if (sessionCookie) {
    const parsedId = parseInt(sessionCookie, 10);
    if (!isNaN(parsedId)) return parsedId;
  }

  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.id) {
    const parsedId = parseInt(nextAuthSession.user.id, 10);
    if (!isNaN(parsedId)) return parsedId;
  } else if (nextAuthSession?.user?.email) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: nextAuthSession.user.email },
      select: { id: true },
    });
    if (userByEmail) return userByEmail.id;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Bạn cần đăng nhập để đánh giá dịch vụ" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bookingId, rating, comment, images } = body;

    const parsedBookingId = parseInt(bookingId, 10);
    const parsedRating = parseInt(rating, 10);

    if (isNaN(parsedBookingId)) {
      return NextResponse.json(
        { success: false, message: "Mã đơn hàng không hợp lệ" },
        { status: 400 }
      );
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, message: "Số sao đánh giá phải từ 1 đến 5 sao" },
        { status: 400 }
      );
    }

    // 1. Kiểm tra đơn hàng thuộc về chính người dùng và có trạng thái COMPLETED
    const booking = await prisma.booking.findUnique({
      where: { id: parsedBookingId },
      include: {
        review: true,
        service: {
          select: { id: true, shopId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    if (booking.customerId !== userId) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền đánh giá đơn hàng này" },
        { status: 403 }
      );
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Chỉ có thể đánh giá khi đơn hàng đã hoàn thành (COMPLETED)",
        },
        { status: 400 }
      );
    }

    if (booking.review) {
      return NextResponse.json(
        { success: false, message: "Đơn hàng này đã được đánh giá trước đó" },
        { status: 400 }
      );
    }

    // Xử lý danh sách hình ảnh (lọc url/base64 hợp lệ)
    let processedImages: string[] = [];
    if (Array.isArray(images)) {
      processedImages = images
        .filter((img) => typeof img === "string" && img.trim().length > 0)
        .slice(0, 5); // Cho phép tối đa 5 ảnh
    }

    // 2. Tạo bản ghi Review
    const newReview = await prisma.review.create({
      data: {
        bookingId: parsedBookingId,
        customerId: userId,
        serviceId: booking.serviceId,
        rating: parsedRating,
        comment: comment?.trim() || "Dịch vụ rất tốt!",
        images: processedImages,
      },
    });

    // 3. Cập nhật lại rating trung bình và tổng số review của dịch vụ (DichVu)
    const allServiceReviews = await prisma.review.findMany({
      where: { serviceId: booking.serviceId },
      select: { rating: true },
    });

    const totalServiceReviews = allServiceReviews.length;
    const avgServiceRating =
      totalServiceReviews > 0
        ? Number(
            (
              allServiceReviews.reduce((sum, r) => sum + r.rating, 0) /
              totalServiceReviews
            ).toFixed(1)
          )
        : 5.0;

    await prisma.dichVu.update({
      where: { id: booking.serviceId },
      data: {
        rating: avgServiceRating,
        totalReviews: totalServiceReviews,
      },
    });

    // 4. Cập nhật lại rating trung bình của shop/đơn vị cung cấp
    if (booking.service.shopId) {
      const allShopReviews = await prisma.review.findMany({
        where: {
          service: { shopId: booking.service.shopId },
        },
        select: { rating: true },
      });

      const totalShopReviews = allShopReviews.length;
      const avgShopRating =
        totalShopReviews > 0
          ? Number(
              (
                allShopReviews.reduce((sum, r) => sum + r.rating, 0) /
                totalShopReviews
              ).toFixed(1)
            )
          : 5.0;

      await prisma.shop.update({
        where: { id: booking.service.shopId },
        data: {
          rating: avgShopRating,
          totalReviews: totalShopReviews,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Gửi đánh giá thành công! Cảm ơn phản hồi của bạn.",
      review: {
        id: newReview.id,
        rating: newReview.rating,
        comment: newReview.comment,
        images: processedImages,
        createdAt: newReview.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi gửi đánh giá đơn hàng:", error);
    return NextResponse.json(
      { success: false, message: "Không thể gửi đánh giá", error: msg },
      { status: 500 }
    );
  }
}
