import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { BookingStatus, PaymentMethod, PaymentStatus } from "@/src/generated/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { createVnpayPaymentUrl } from "@/src/lib/vnpay";

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

function generateBookingCode(): string {
  const prefix = "CM";
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${dateStr}-${randomStr}`;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để tiến hành đặt lịch" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      items, // Mảng [{ serviceId, quantity, scheduledDate, note, price }]
      address, // Chuỗi địa chỉ chi tiết
      receiverName,
      phone,
      paymentMethod = "CASH", // Chỉ hỗ trợ CASH hoặc VNPAY
      customerNote,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không có dịch vụ nào trong đơn đặt lịch" },
        { status: 400 }
      );
    }

    if (!address || !phone) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp địa chỉ và số điện thoại liên hệ" },
        { status: 400 }
      );
    }

    // Chỉ chấp nhận CASH hoặc VNPAY
    const chosenMethod = paymentMethod === "VNPAY" ? PaymentMethod.VNPAY : PaymentMethod.CASH;

    const createdBookings = [];
    let grandTotal = 0;
    const firstTxnRef = `CM${Date.now()}`;

    // Tạo booking cho từng dịch vụ được đặt
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const service = await prisma.dichVu.findUnique({
        where: { id: Number(item.serviceId) },
        select: { id: true, title: true, priceStart: true },
      });

      if (!service) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = item.price ? Number(item.price) : Number(service.priceStart);
      const totalPrice = unitPrice * qty;
      grandTotal += totalPrice;

      const bookingCode = generateBookingCode();
      const scheduledDate = item.scheduledDate ? new Date(item.scheduledDate) : new Date();

      const fullAddress = receiverName ? `${receiverName} - ${phone} | ${address}` : `${phone} | ${address}`;
      const finalNote = [item.note, customerNote].filter(Boolean).join(" | ");

      const transactionId = i === 0 ? firstTxnRef : `${firstTxnRef}-${i}`;

      const booking = await prisma.booking.create({
        data: {
          bookingCode,
          scheduledDate,
          address: fullAddress,
          note: finalNote || null,
          totalPrice,
          status: BookingStatus.PENDING,
          customerId: userId,
          serviceId: service.id,
          payment: {
            create: {
              amount: totalPrice,
              method: chosenMethod,
              status: PaymentStatus.PENDING,
              transactionId,
            },
          },
        },
        include: {
          service: {
            select: { id: true, title: true },
          },
          payment: true,
        },
      });

      createdBookings.push(booking);
    }

    // Xóa giỏ hàng trong database nếu có
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    // Nếu chọn thanh toán VNPAY -> Sinh URL chuyển tiếp sang cổng VNPay
    let paymentUrl = null;
    if (chosenMethod === PaymentMethod.VNPAY && grandTotal > 0) {
      const forwarded = req.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

      const origin = req.nextUrl.origin || "http://localhost:3000";
      const returnUrl = `${origin}/api/payment/vnpay-return`;

      paymentUrl = createVnpayPaymentUrl({
        amount: grandTotal,
        orderId: firstTxnRef,
        orderInfo: `Thanh toan don dich vu CleanMate ${createdBookings[0]?.bookingCode}`,
        ipAddr: clientIp,
        returnUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đặt lịch thành công!",
      bookings: createdBookings,
      totalAmount: grandTotal,
      paymentMethod: chosenMethod,
      paymentUrl,
    });
  } catch (error: unknown) {
    console.error("Lỗi đặt đơn:", error);
    const msg = error instanceof Error ? error.message : "Lỗi server khi đặt đơn";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
