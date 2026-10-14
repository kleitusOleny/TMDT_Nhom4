import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập Email / Số điện thoại và Mật khẩu" },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Tìm kiếm người dùng trong Database MySQL qua email hoặc phone
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmedIdentifier },
            { phone: trimmedIdentifier },
          ],
        },
      });
    } catch (dbError) {
      console.warn("Chưa thể kết nối MySQL:", dbError);
    }

    // Nếu không tìm thấy người dùng
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    // Kiểm tra mật khẩu (hỗ trợ hash bcrypt và fallback plain text)
    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Đăng nhập thành công
    const { password: _password, ...userData } = user;
    void _password;

    const isUserAdmin = user.role === "ADMIN";

    const response = NextResponse.json(
      {
        success: true,
        message: isUserAdmin
          ? "Đăng nhập Quản Trị Viên thành công! Đang chuyển hướng..."
          : "Đăng nhập thành công! Đang chuyển hướng...",
        user: {
          ...userData,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Lưu cookie phiên đăng nhập
    response.cookies.set("cleanmate_session", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Login API Error:", error);
    return NextResponse.json(
      { 
        message: "Lỗi xử lý đăng nhập. Vui lòng kiểm tra lại kết nối.",
        error: errMessage 
      },
      { status: 500 }
    );
  }
}