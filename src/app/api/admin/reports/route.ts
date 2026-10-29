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
      const u = await prisma.user.findUnique({
        where: { email: nextAuthSession.user.email },
        select: { id: true, role: true },
      });
      if (u) return u;
    }
  }

  if (!userId) return null;

  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

// 1. GET: Danh sách báo cáo cho trang Admin (lọc theo type, status, search query)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Chỉ Admin mới có quyền truy cập danh sách báo cáo" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status");
    const query = searchParams.get("q") || "";

    const where: Record<string, unknown> = {};

    if (typeFilter && typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    if (query.trim()) {
      where.OR = [
        { reason: { contains: query } },
        { adminNote: { contains: query } },
        { reporter: { fullName: { contains: query } } },
        { reportedUser: { fullName: { contains: query } } },
        { reportedShop: { name: { contains: query } } },
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            image: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            image: true,
            isActive: true,
          },
        },
        reportedShop: {
          select: {
            id: true,
            name: true,
            slug: true,
            rating: true,
            totalReviews: true,
            owner: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
      },
    });

    const formattedReports = reports.map((r) => {
      // Bóc tách metadata (bookingCode, target, details, images) nếu reason là dạng JSON
      let title = "";
      let details = r.reason;
      let targetName = "";
      let bookingCode = "";
      let images: string[] = [];

      try {
        if (r.reason.startsWith("{") && r.reason.endsWith("}")) {
          const parsed = JSON.parse(r.reason);
          title = parsed.title || "";
          details = parsed.details || parsed.reason || r.reason;
          targetName = parsed.targetName || "";
          bookingCode = parsed.bookingCode || "";
          if (Array.isArray(parsed.images)) images = parsed.images;
        }
      } catch {
        // reason là chuỗi văn bản thông thường
      }

      return {
        id: r.id,
        type: r.type,
        reason: details,
        title: title || (r.type === "CUSTOMER" ? "Báo cáo người dùng" : "Báo cáo giao hàng / dịch vụ"),
        targetName: targetName || r.reportedUser?.fullName || r.reportedShop?.name || "Không xác định",
        bookingCode,
        images,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        reporter: {
          id: r.reporter.id,
          fullName: r.reporter.fullName || "Người dùng",
          phone: r.reporter.phone,
          email: r.reporter.email,
          role: r.reporter.role,
          image: r.reporter.image,
        },
        reportedUser: r.reportedUser
          ? {
              id: r.reportedUser.id,
              fullName: r.reportedUser.fullName || "Người dùng",
              phone: r.reportedUser.phone,
              email: r.reportedUser.email,
              role: r.reportedUser.role,
              image: r.reportedUser.image,
              isActive: r.reportedUser.isActive,
            }
          : null,
        reportedShop: r.reportedShop
          ? {
              id: r.reportedShop.id,
              name: r.reportedShop.name,
              rating: r.reportedShop.rating,
              ownerName: r.reportedShop.owner?.fullName,
              ownerPhone: r.reportedShop.owner?.phone,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      reports: formattedReports,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi lấy danh sách báo cáo:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 2. PATCH: Cập nhật trạng thái xử lý báo cáo (PENDING, REVIEWING, RESOLVED, REJECTED) kèm ghi chú admin
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Chỉ Admin mới có quyền cập nhật trạng thái báo cáo" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status, adminNote, blockReportedUser } = body;

    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json(
        { success: false, message: "ID báo cáo không hợp lệ" },
        { status: 400 }
      );
    }

    const currentReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!currentReport) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy báo cáo" },
        { status: 404 }
      );
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(status ? { status } : {}),
        ...(typeof adminNote === "string" ? { adminNote: adminNote.trim() } : {}),
      },
    });

    // Nếu admin chọn khóa tạm thời người dùng bị báo cáo vi phạm
    if (blockReportedUser && currentReport.reportedUserId) {
      await prisma.user.update({
        where: { id: currentReport.reportedUserId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái báo cáo thành công",
      report: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi cập nhật báo cáo:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 3. DELETE: Xóa báo cáo
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Chỉ Admin mới có quyền xóa báo cáo" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id");
    if (!reportId) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID báo cáo" },
        { status: 400 }
      );
    }

    await prisma.report.delete({
      where: { id: parseInt(reportId, 10) },
    });

    return NextResponse.json({
      success: true,
      message: "Xóa báo cáo thành công",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
