import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { BookingStatus, PaymentStatus } from "@/src/generated/prisma/client";
import { verifyVnpaySignature } from "@/src/lib/vnpay";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const { isValid, responseCode, txnRef } = verifyVnpaySignature(queryParams);

    // Giao dịch thành công khi chữ ký hợp lệ và mã phản hồi của VNPay là "00"
    const isSuccess = isValid && responseCode === "00";

    if (txnRef) {
      // 1. Tìm tất cả các booking có transactionId bắt đầu bằng txnRef (để hỗ trợ đơn gồm nhiều dịch vụ)
      const relatedPayments = await prisma.payment.findMany({
        where: {
          OR: [
            { transactionId: txnRef },
            { transactionId: { startsWith: `${txnRef}-` } },
          ],
        },
        select: { id: true, bookingId: true },
      });

      const bookingIds = relatedPayments.map((p) => p.bookingId);

      // Nếu không tìm thấy qua payment, tìm qua bookingCode
      if (bookingIds.length === 0) {
        const singleBooking = await prisma.booking.findFirst({
          where: { bookingCode: txnRef },
          select: { id: true },
        });
        if (singleBooking) {
          bookingIds.push(singleBooking.id);
        }
      }

      if (bookingIds.length > 0) {
        if (isSuccess) {
          // Cập nhật trạng thái Booking sang CONFIRMED và Payment sang COMPLETED
          await prisma.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: { status: BookingStatus.CONFIRMED },
          });

          await prisma.payment.updateMany({
            where: { bookingId: { in: bookingIds } },
            data: {
              status: PaymentStatus.COMPLETED,
              providerData: queryParams,
            },
          });
        } else {
          // Cập nhật thanh toán thất bại
          await prisma.payment.updateMany({
            where: { bookingId: { in: bookingIds } },
            data: {
              status: PaymentStatus.FAILED,
              providerData: queryParams,
            },
          });
        }
      }
    }

    // Chuyển hướng người dùng về trang checkout kết quả
    const redirectUrl = new URL("/checkout", req.url);
    redirectUrl.searchParams.set("vnpay_status", isSuccess ? "success" : "failed");
    redirectUrl.searchParams.set("vnp_TxnRef", txnRef);
    if (!isSuccess) {
      redirectUrl.searchParams.set("error_code", responseCode);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Lỗi xử lý kết quả VNPay Return:", error);
    return NextResponse.redirect(new URL("/checkout?vnpay_status=failed", req.url));
  }
}
