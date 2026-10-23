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

    // txnRef chính là bookingCode hoặc transactionId mà ta gửi sang VNPay
    const isSuccess = isValid && responseCode === "00";

    if (txnRef) {
      // Tìm booking theo bookingCode hoặc payment transactionId
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { bookingCode: txnRef },
            { payment: { transactionId: txnRef } },
          ],
        },
        include: { payment: true },
      });

      if (booking) {
        if (isSuccess) {
          // Cập nhật thanh toán thành công
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              payment: {
                update: {
                  status: PaymentStatus.COMPLETED,
                  providerData: queryParams,
                },
              },
            },
          });
        } else {
          // Cập nhật thanh toán thất bại
          if (booking.payment) {
            await prisma.payment.update({
              where: { id: booking.payment.id },
              data: {
                status: PaymentStatus.FAILED,
                providerData: queryParams,
              },
            });
          }
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
