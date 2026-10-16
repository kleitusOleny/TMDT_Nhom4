import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dichVuId = parseInt(id, 10);

    if (isNaN(dichVuId)) {
      return NextResponse.json(
        { success: false, message: "ID dịch vụ không hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Xác thực người dùng (từ cookie hoặc NextAuth)
    let userId: number | null = null;
    const sessionCookie = req.cookies.get("cleanmate_session")?.value;
    if (sessionCookie) {
      const parsedId = parseInt(sessionCookie, 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    }

    if (!userId) {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user?.id) {
        const parsedId = parseInt(nextAuthSession.user.id, 10);
        if (!isNaN(parsedId)) {
          userId = parsedId;
        }
      } else if (nextAuthSession?.user?.email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: nextAuthSession.user.email },
          select: { id: true },
        });
        if (userByEmail) {
          userId = userByEmail.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để gửi câu hỏi / bình luận về dịch vụ." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, parentId } = body;

    const trimmedContent = String(content || "").trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập nội dung câu hỏi." },
        { status: 400 }
      );
    }

    // Kiểm tra dịch vụ có tồn tại không
    const serviceExists = await prisma.dichVu.findUnique({
      where: { id: dichVuId },
    });

    if (!serviceExists) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dịch vụ tương ứng." },
        { status: 404 }
      );
    }

    // Tạo bình luận mới
    const newComment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        serviceId: dichVuId,
        userId,
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gửi câu hỏi / bình luận thành công!",
      data: newComment,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Post comment error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể gửi bình luận", error: msg },
      { status: 500 }
    );
  }
}
