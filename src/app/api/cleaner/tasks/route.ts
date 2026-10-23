import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

async function getAuthenticatedUser(req: NextRequest) {
  let userId: number | null = null;
  const sessionCookie = req.cookies.get("cleanmate_session")?.value;
  if (sessionCookie) {
    const parsedId = parseInt(sessionCookie, 10);
    if (!isNaN(parsedId)) userId = parsedId;
  }
  if (!userId) {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.id) {
      const parsedId = parseInt(nextAuthSession.user.id, 10);
      if (!isNaN(parsedId)) userId = parsedId;
    } else if (nextAuthSession?.user?.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: nextAuthSession.user.email },
        select: { id: true },
      });
      if (userByEmail) userId = userByEmail.id;
    }
  }
  if (!userId) return null;
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, phone: true, email: true, role: true },
  });
}

// GET: Lấy danh sách nhiệm vụ / ca dọn dẹp
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    if (user.role !== "CLEANER" && user.role !== "STAFF" && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Chỉ nhân viên dọn dẹp (Cleaner) mới có quyền truy cập" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL | AVAILABLE | IN_PROGRESS | COMPLETED

    // Lấy các đơn hàng
    const bookings = await prisma.booking.findMany({
      orderBy: { scheduledDate: "asc" },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        service: {
          select: {
            id: true,
            title: true,
            images: true,
            shop: { select: { id: true, name: true, address: true } },
          },
        },
        payment: {
          select: { id: true, amount: true, status: true, method: true, tipAmount: true },
        },
      },
    });

    const tasks = bookings.map((b) => {
      let imagesList: string[] = [];
      if (typeof b.service.images === "string") {
        try {
          imagesList = JSON.parse(b.service.images);
        } catch {
          imagesList = [b.service.images];
        }
      } else if (Array.isArray(b.service.images)) {
        imagesList = b.service.images as string[];
      }

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        scheduledDate: b.scheduledDate.toISOString(),
        address: b.address,
        note: b.note,
        totalPrice: Number(b.totalPrice),
        status: b.status,
        customer: b.customer,
        service: {
          id: b.service.id,
          title: b.service.title,
          image: imagesList[0] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
          shopName: b.service.shop?.name || "CleanMate Partner",
        },
        payment: b.payment
          ? {
              status: b.payment.status,
              amount: Number(b.payment.amount),
              tipAmount: Number(b.payment.tipAmount || 0),
              method: b.payment.method,
            }
          : null,
        beforeImages: b.beforeImages,
        afterImages: b.afterImages,
        createdAt: b.createdAt.toISOString(),
      };
    });

    let filteredTasks = tasks;
    if (filter === "AVAILABLE") {
      filteredTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "CONFIRMED");
    } else if (filter === "IN_PROGRESS") {
      filteredTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
    } else if (filter === "COMPLETED") {
      filteredTasks = tasks.filter((t) => t.status === "COMPLETED");
    }

    // Thống kê nhanh cho cleaner
    const stats = {
      totalAssigned: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING" || t.status === "CONFIRMED").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      totalIncome: tasks
        .filter((t) => t.status === "COMPLETED")
        .reduce((sum, t) => sum + (t.totalPrice || 0), 0),
    };

    return NextResponse.json({
      success: true,
      stats,
      tasks: filteredTasks,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PATCH: Cập nhật trạng thái nhiệm vụ (Nhận đơn -> Bắt đầu làm -> Hoàn thành)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    if (user.role !== "CLEANER" && user.role !== "STAFF" && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Không có quyền thực hiện thao tác này" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bookingId, status, beforeImages, afterImages } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đơn đặt lịch hoặc trạng thái cần cập nhật" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { status };
    if (beforeImages) data.beforeImages = beforeImages;
    if (afterImages) data.afterImages = afterImages;

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(bookingId) },
      data,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn #${updatedBooking.bookingCode} thành ${status}`,
      booking: updatedBooking,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
