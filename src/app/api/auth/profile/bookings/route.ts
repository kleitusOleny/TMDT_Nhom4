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

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            images: true,
            duration: true,
            priceStart: true,
            shop: {
              select: { id: true, name: true, phone: true, area: true, address: true },
            },
            categories: {
              select: { id: true, name: true },
              take: 1,
            },
          },
        },
        cleaner: {
          select: { id: true, fullName: true, phone: true, email: true, avatar: true },
        },
        payment: true,
        review: true,
      },
    });

    const formatted = bookings.map((b) => {
      let serviceImg = "";
      try {
        if (typeof b.service.images === "string") {
          const parsed = JSON.parse(b.service.images);
          serviceImg = Array.isArray(parsed) ? parsed[0] : parsed;
        } else if (Array.isArray(b.service.images)) {
          serviceImg = (b.service.images as string[])[0] || "";
        }
      } catch {
        serviceImg = "";
      }

      const beforeImgs = Array.isArray(b.beforeImages)
        ? (b.beforeImages as string[])
        : typeof b.beforeImages === "string"
        ? [b.beforeImages]
        : [];

      const afterImgs = Array.isArray(b.afterImages)
        ? (b.afterImages as string[])
        : typeof b.afterImages === "string"
        ? [b.afterImages]
        : [];

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        serviceId: b.service.id,
        serviceTitle: b.service.title,
        serviceImage: serviceImg,
        serviceDuration: b.service.duration,
        categoryName: b.service.categories[0]?.name || "Vệ sinh",
        shopId: b.service.shop?.id,
        shopName: b.service.shop?.name || "Đối tác CleanMate",
        shopPhone: b.service.shop?.phone,
        shopAddress: b.service.shop?.address,
        cleaner: b.cleaner
          ? {
              id: b.cleaner.id,
              fullName: b.cleaner.fullName || "Nhân viên dọn dẹp",
              phone: b.cleaner.phone || "---",
              email: b.cleaner.email,
              avatar: b.cleaner.avatar,
            }
          : null,
        scheduledDate: b.scheduledDate.toISOString(),
        address: b.address,
        note: b.note,
        totalPrice: Number(b.totalPrice),
        status: b.status,
        cancellationReason: b.cancellationReason,
        beforeImages: beforeImgs,
        afterImages: afterImgs,
        isAcceptedByCustomer: b.isAcceptedByCustomer,
        paymentStatus: b.payment?.status || "PENDING",
        paymentMethod: b.payment?.method || "CASH",
        paymentAmount: Number(b.payment?.amount || b.totalPrice),
        tipAmount: Number(b.payment?.tipAmount || 0),
        transactionId: b.payment?.transactionId,
        createdAt: b.createdAt.toISOString(),
        hasReviewed: Boolean(b.review),
        rating: b.review?.rating || null,
        reviewComment: b.review?.comment || null,
      };
    });

    return NextResponse.json({ success: true, bookings: formatted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
