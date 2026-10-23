import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { BookingStatus, PaymentMethod } from "@/src/generated/prisma/client";
import { BookingRecord } from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const paymentMethod = searchParams.get("paymentMethod");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const query = searchParams.get("q")?.toLowerCase();

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL" && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }

    if (sellerId && sellerId !== "ALL") {
      const parsedSellerId = parseInt(sellerId, 10);
      if (!isNaN(parsedSellerId)) {
        where.service = {
          shopId: parsedSellerId,
        };
      }
    }

    if (paymentMethod && paymentMethod !== "ALL") {
      where.payment = {
        method: paymentMethod as PaymentMethod,
      };
    }

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) {
        (where.scheduledDate as Record<string, unknown>).gte = new Date(`${fromDate}T00:00:00.000Z`);
      }
      if (toDate) {
        (where.scheduledDate as Record<string, unknown>).lte = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    if (query) {
      where.OR = [
        { bookingCode: { contains: query } },
        { address: { contains: query } },
        { note: { contains: query } },
        { customer: { fullName: { contains: query } } },
        { customer: { phone: { contains: query } } },
        { service: { title: { contains: query } } },
        { service: { shop: { name: { contains: query } } } },
      ];
    }

    const dbBookings = await prisma.booking.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { scheduledDate: "desc" }],
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        cleaner: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        service: {
          select: {
            id: true,
            title: true,
            priceStart: true,
            duration: true,
            shop: { select: { id: true, name: true, area: true, address: true } },
            categories: { select: { name: true }, take: 1 },
          },
        },
        payment: {
          select: { id: true, method: true, status: true, amount: true, tipAmount: true, transactionId: true },
        },
        cancelledBy: {
          select: { fullName: true, role: true },
        },
      },
    });

    const formattedList: (BookingRecord & {
      customerEmail?: string | null;
      note?: string | null;
      tipAmount?: number;
      paymentStatus?: string;
      transactionId?: string | null;
      beforeImages?: string[];
      afterImages?: string[];
      cancellationReason?: string | null;
    })[] = dbBookings.map((b) => {
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
        customerEmail: b.customer.email,
        serviceId: b.service.id,
        serviceName: b.service.title,
        category: b.service.categories[0]?.name || "Vệ sinh",
        sellerId: b.service.shop.id,
        sellerName: b.service.shop.name,
        cleanerId: b.cleanerId,
        assignedStaff: b.cleaner?.fullName || (b.isAcceptedByCustomer ? "Kỹ thuật viên đối tác" : undefined),
        bookingDate: dateStr,
        bookingTime: timeStr,
        address: b.address,
        note: b.note,
        totalAmount,
        commissionFee,
        sellerEarnings,
        paymentMethod: (b.payment?.method as BookingRecord["paymentMethod"]) || "CASH",
        paymentStatus: b.payment?.status || (b.status === "COMPLETED" ? "COMPLETED" : "PENDING"),
        tipAmount: Number(b.payment?.tipAmount || 0),
        transactionId: b.payment?.transactionId,
        status: b.status as BookingRecord["status"],
        beforeImages: (b.beforeImages as string[]) || [],
        afterImages: (b.afterImages as string[]) || [],
        cancellationReason: b.cancellationReason,
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, bookings: formattedList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, serviceId, scheduledDate, address, note, totalPrice, paymentMethod } = body;

    if (!serviceId || !scheduledDate || !address) {
      return NextResponse.json(
        { success: false, message: "Thiếu dịch vụ, ngày hẹn hoặc địa chỉ" },
        { status: 400 }
      );
    }

    // Lấy customer hoặc mặc định
    let targetCustomerId = Number(customerId);
    if (!targetCustomerId) {
      const defaultCust = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
      targetCustomerId = defaultCust?.id || 1;
    }

    const bookingCode = `CM-BK-${Date.now().toString().slice(-6)}`;
    const parsedPrice = Number(totalPrice) || 250000;

    const newBooking = await prisma.booking.create({
      data: {
        bookingCode,
        scheduledDate: new Date(scheduledDate),
        address,
        note: note || "Đơn đặt từ ban quản trị",
        totalPrice: parsedPrice,
        status: "CONFIRMED",
        customerId: targetCustomerId,
        serviceId: Number(serviceId),
        payment: {
          create: {
            amount: parsedPrice,
            method: (paymentMethod as PaymentMethod) || "CASH",
            status: "PENDING",
            transactionId: `TXN-${bookingCode}`,
          },
        },
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
        payment: true,
      },
    });

    const dateObj = new Date(newBooking.scheduledDate);
    const formatted: BookingRecord = {
      id: newBooking.bookingCode,
      customerName: newBooking.customer.fullName || "Khách hàng",
      customerPhone: newBooking.customer.phone || "---",
      serviceId: newBooking.service.id,
      serviceName: newBooking.service.title,
      category: newBooking.service.categories[0]?.name || "Vệ sinh",
      sellerId: newBooking.service.shop.id,
      sellerName: newBooking.service.shop.name,
      bookingDate: dateObj.toISOString().split("T")[0],
      bookingTime: `${String(dateObj.getHours()).padStart(2, "0")}:${String(
        dateObj.getMinutes()
      ).padStart(2, "0")}`,
      address: newBooking.address,
      totalAmount: parsedPrice,
      commissionFee: Math.round(parsedPrice * 0.15),
      sellerEarnings: parsedPrice - Math.round(parsedPrice * 0.15),
      paymentMethod: (newBooking.payment?.method as BookingRecord["paymentMethod"]) || "CASH",
      status: newBooking.status as BookingRecord["status"],
      createdAt: newBooking.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Tạo đơn đặt dịch vụ mới thành công!",
      booking: formatted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status, scheduledDate, address, note, totalPrice, cleanerId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đơn hàng" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status as BookingStatus;
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
    if (address) data.address = address;
    if (note !== undefined) data.note = note;
    if (totalPrice !== undefined && !isNaN(Number(totalPrice))) data.totalPrice = Number(totalPrice);
    if (cleanerId !== undefined) data.cleanerId = cleanerId ? Number(cleanerId) : null;

    const updated = await prisma.booking.update({
      where: { bookingCode: bookingId },
      data,
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
        payment: { select: { method: true, status: true } },
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingCode = searchParams.get("id");

    if (!bookingCode) {
      return NextResponse.json({ success: false, message: "Thiếu mã đơn hàng cần hủy/xóa" }, { status: 400 });
    }

    // Chuyển trạng thái sang CANCELLED hoặc xóa cứng nếu chưa thanh toán
    await prisma.booking.update({
      where: { bookingCode },
      data: {
        status: "CANCELLED",
        cancellationReason: "Ban quản trị hủy đơn theo yêu cầu",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã hủy đơn hàng thành công trên hệ thống!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
