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
    const reporterId = await getAuthenticatedUserId(req);
    if (!reporterId) {
      return NextResponse.json(
        { success: false, message: "Bạn cần đăng nhập để gửi báo cáo" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      type, // "DELIVERY" (giao hàng / thực hiện đơn) | "CUSTOMER" (người dùng / khách hàng / thợ) | "SHOP" | "SERVICE"
      title,
      details,
      bookingCode,
      targetName,
      reportedUserId,
      reportedShopId,
      images,
    } = body;

    if (!details || !details.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập chi tiết lý do báo cáo" },
        { status: 400 }
      );
    }

    // Đóng gói lý do + metadata bổ sung (hình ảnh, mã đơn, tiêu đề) vào chuỗi JSON
    const reportPayload = JSON.stringify({
      title: title?.trim() || (type === "DELIVERY" ? "Sự cố thực hiện / giao hàng" : "Báo cáo vi phạm người dùng"),
      details: details.trim(),
      bookingCode: bookingCode?.trim() || "",
      targetName: targetName?.trim() || "",
      images: Array.isArray(images) ? images.slice(0, 5) : [],
    });

    // Xác định enum type hợp lệ trong prisma: SHOP, CUSTOMER, SERVICE, REVIEW
    // Nếu là DELIVERY (giao hàng / đơn hàng), map vào SERVICE hoặc SHOP
    let dbType: "SHOP" | "CUSTOMER" | "SERVICE" | "REVIEW" = "CUSTOMER";
    if (type === "DELIVERY" || type === "SERVICE") {
      dbType = "SERVICE";
    } else if (type === "SHOP") {
      dbType = "SHOP";
    } else if (type === "REVIEW") {
      dbType = "REVIEW";
    } else {
      dbType = "CUSTOMER";
    }

    const createdReport = await prisma.report.create({
      data: {
        type: dbType,
        reason: reportPayload,
        status: "PENDING",
        reporterId,
        reportedUserId: reportedUserId ? parseInt(reportedUserId, 10) : null,
        reportedShopId: reportedShopId ? parseInt(reportedShopId, 10) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gửi báo cáo thành công! Ban quản trị sẽ sớm xem xét và xử lý.",
      reportId: createdReport.id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi tạo báo cáo:", error);
    return NextResponse.json(
      { success: false, message: "Không thể gửi báo cáo", error: msg },
      { status: 500 }
    );
  }
}
