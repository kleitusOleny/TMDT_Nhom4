import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  try {
    let userId: number | null = null;

    // 1. Kiểm tra session cookie nội bộ cleanmate_session
    const sessionCookie = req.cookies.get("cleanmate_session")?.value;
    if (sessionCookie) {
      const parsedId = parseInt(sessionCookie, 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    }

    // 2. Kiểm tra NextAuth session
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
        { message: "Bạn cần đăng nhập để thực hiện chức năng này" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, phone, dateOfBirth, image, currentPassword, newPassword } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Cập nhật họ tên
    if (fullName !== undefined) {
      updateData.fullName = String(fullName).trim();
    }

    // Cập nhật số điện thoại (kiểm tra trùng lặp nếu đổi số mới)
    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();
      if (cleanPhone && cleanPhone !== existingUser.phone) {
        const duplicate = await prisma.user.findUnique({
          where: { phone: cleanPhone },
        });
        if (duplicate) {
          return NextResponse.json(
            { message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác" },
            { status: 409 }
          );
        }
        updateData.phone = cleanPhone;
      }
    }

    // Cập nhật ngày sinh
    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const d = new Date(dateOfBirth);
        if (!isNaN(d.getTime())) {
          updateData.dateOfBirth = d;
        }
      } else {
        updateData.dateOfBirth = null;
      }
    }

    // Cập nhật ảnh đại diện
    if (image !== undefined) {
      updateData.image = image;
    }

    // Đổi mật khẩu nếu người dùng nhập
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: "Mật khẩu mới phải có ít nhất 6 ký tự" },
          { status: 400 }
        );
      }

      if (existingUser.password) {
        if (!currentPassword) {
          return NextResponse.json(
            { message: "Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu mới" },
            { status: 400 }
          );
        }

        let isMatch = false;
        if (existingUser.password.startsWith("$2a$") || existingUser.password.startsWith("$2b$")) {
          isMatch = await bcrypt.compare(currentPassword, existingUser.password);
        } else {
          isMatch = existingUser.password === currentPassword;
        }

        if (!isMatch) {
          return NextResponse.json(
            { message: "Mật khẩu hiện tại không chính xác" },
            { status: 400 }
          );
        }
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        image: true,
        dateOfBirth: true,
        createdAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công!",
      user: updatedUser,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi cập nhật profile:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật thông tin cá nhân", error: msg },
      { status: 500 }
    );
  }
}
