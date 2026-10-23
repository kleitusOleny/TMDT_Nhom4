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
            shop: {
              select: { id: true, name: true },
            },
          },
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

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        serviceId: b.service.id,
        serviceTitle: b.service.title,
        serviceImage: serviceImg,
        shopName: b.service.shop?.name || "Đối tác CleanMate",
        scheduledDate: b.scheduledDate.toISOString(),
        address: b.address,
        note: b.note,
        totalPrice: Number(b.totalPrice),
        status: b.status,
        paymentStatus: b.payment?.status || "PENDING",
        paymentMethod: b.payment?.method || "CASH",
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
