import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

// Thông tin tài khoản Admin mặc định của hệ thống
const DEFAULT_ADMIN = {
  id: 1,
  fullName: "Quản Trị Viên CleanMate",
  phone: "0901234567",
  email: "admin@cleanmate.vn",
  role: "ADMIN",
  passwords: ["admin123", "123456"],
};

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

    // 1. KIỂM TRA ĐĂNG NHẬP VỚI TÀI KHOẢN ADMIN HỆ THỐNG
    const isAdminIdentifier =
      trimmedIdentifier === DEFAULT_ADMIN.phone ||
      trimmedIdentifier.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() ||
      trimmedIdentifier.toLowerCase() === "admin";

    if (isAdminIdentifier) {
      if (DEFAULT_ADMIN.passwords.includes(password)) {
        const response = NextResponse.json(
          {
            success: true,
            message: "Đăng nhập Quản Trị Viên thành công! Đang chuyển hướng đến trang Admin...",
            user: {
              id: DEFAULT_ADMIN.id,
              fullName: DEFAULT_ADMIN.fullName,
              phone: DEFAULT_ADMIN.phone,
              email: DEFAULT_ADMIN.email,
              role: DEFAULT_ADMIN.role,
            },
          },
          { status: 200 }
        );

        response.cookies.set("cleanmate_session", String(DEFAULT_ADMIN.id), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
          path: "/",
        });

        return response;
      } else {
        return NextResponse.json(
          { message: "Mật khẩu Admin không chính xác (Mặc định: admin123 hoặc 123456)" },
          { status: 401 }
        );
      }
    }

    // 2. NẾU KHÔNG PHẢI ADMIN MẶC ĐỊNH, TÌM KIẾM TRONG DATABASE MYSQL
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

    // Đăng nhập thành công cho người dùng thường
    const { password: _password, ...userData } = user;
    void _password;

    const response = NextResponse.json(
      {
        success: true,
        message: "Đăng nhập thành công! Đang chuyển hướng...",
        user: {
          ...userData,
          role: (user as Record<string, unknown>).role || "CUSTOMER",
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