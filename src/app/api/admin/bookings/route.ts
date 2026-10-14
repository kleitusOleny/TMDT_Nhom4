import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { BookingStatus } from "@/src/generated/prisma/client";
import { BookingRecord } from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const query = searchParams.get("q")?.toLowerCase();

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL" && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }

    if (sellerId) {
      const parsedSellerId = parseInt(sellerId, 10);
      if (!isNaN(parsedSellerId)) {
        where.service = {
          shopId: parsedSellerId,
        };
      }
    }

    if (query) {
      where.OR = [
        { bookingCode: { contains: query } },
        { address: { contains: query } },
        { customer: { fullName: { contains: query } } },
        { customer: { phone: { contains: query } } },
        { service: { title: { contains: query } } },
        { service: { shop: { name: { contains: query } } } },
      ];
    }

    const dbBookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { fullName: true, phone: true },
        },
        service: {
          select: {
            id: true,
            title: true,
            shop: { select: { id: true, name: true } },
            categories: { select: { name: true }, take: 1 },
          },
        },
        payment: {
          select: { method: true, status: true },
        },
      },
    });

    const formattedList: BookingRecord[] = dbBookings.map((b) => {
      const totalAmount = Number(b.totalPrice);
      const commissionFee = Math.round(totalAmount * 0.15); // Phí sàn 15%
      const sellerEarnings = totalAmount - commissionFee;

      const dateObj = new Date(b.scheduledDate);
      const dateStr = dateObj.toISOString().split("T")[0];
      const timeStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(
        dateObj.getMinutes()
      ).padStart(2, "0")}`;

      return {
        id: b.bookingCode,
        customerName: b.customer.fullName || "Khách hàng",
        customerPhone: b.customer.phone || "---",
        serviceId: b.service.id,
        serviceName: b.service.title,
        category: b.service.categories[0]?.name || "Vệ sinh",
        sellerId: b.service.shop.id,
        sellerName: b.service.shop.name,
        assignedStaff: b.isAcceptedByCustomer ? "Kỹ thuật viên đối tác" : undefined,
        bookingDate: dateStr,
        bookingTime: timeStr,
        address: b.address,
        totalAmount,
        commissionFee,
        sellerEarnings,
        paymentMethod: (b.payment?.method as BookingRecord["paymentMethod"]) || "CASH",
        status: b.status as BookingRecord["status"],
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, bookings: formattedList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đơn hàng hoặc trạng thái" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { bookingCode: bookingId },
      data: {
        status: status as BookingStatus,
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        service: {
          select: {
            id: true,
            title: true,
            shop: { select: { id: true, name: true } },
            categories: { select: { name: true }, take: 1 },
          },
        },
        payment: { select: { method: true } },
      },
    });

    const totalAmount = Number(updated.totalPrice);
    const commissionFee = Math.round(totalAmount * 0.15);
    const sellerEarnings = totalAmount - commissionFee;
    const dateObj = new Date(updated.scheduledDate);

    const formatted: BookingRecord = {
      id: updated.bookingCode,
      customerName: updated.customer.fullName || "Khách hàng",
      customerPhone: updated.customer.phone || "---",
      serviceId: updated.service.id,
      serviceName: updated.service.title,
      category: updated.service.categories[0]?.name || "Vệ sinh",
      sellerId: updated.service.shop.id,
      sellerName: updated.service.shop.name,
      bookingDate: dateObj.toISOString().split("T")[0],
      bookingTime: `${String(dateObj.getHours()).padStart(2, "0")}:${String(
        dateObj.getMinutes()
      ).padStart(2, "0")}`,
      address: updated.address,
      totalAmount,
      commissionFee,
      sellerEarnings,
      paymentMethod: (updated.payment?.method as BookingRecord["paymentMethod"]) || "CASH",
      status: updated.status as BookingRecord["status"],
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Cập nhật đơn đặt dịch vụ trong database thành công!",
      booking: formatted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
