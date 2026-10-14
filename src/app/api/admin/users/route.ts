import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q")?.toLowerCase();

    const where: Record<string, unknown> = {};

    if (roleParam && roleParam !== "ALL") {
      if (roleParam === "SELLER") {
        where.role = Role.PROVIDER;
      } else if (Object.values(Role).includes(roleParam as Role)) {
        where.role = roleParam as Role;
      }
    }

    if (statusParam && statusParam !== "ALL") {
      where.isActive = statusParam === "ACTIVE";
    }

    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        {
          shops: {
            some: {
              name: { contains: query },
            },
          },
        },
      ];
    }

    const dbUsers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        shops: {
          select: { id: true, name: true },
          take: 1,
        },
      },
    });

    const formattedUsers = dbUsers.map((u) => {
      let displayRole: "ADMIN" | "SELLER" | "CUSTOMER" | "STAFF" = "CUSTOMER";
      if (u.role === "ADMIN") displayRole = "ADMIN";
      else if (u.role === "STAFF") displayRole = "STAFF";
      else if (u.role === "PROVIDER" || u.shops.length > 0) displayRole = "SELLER";

      return {
        id: u.id,
        fullName: u.fullName || (u.phone ? `Người dùng ${u.phone.slice(-4)}` : "Chưa đặt tên"),
        phone: u.phone || "---",
        email: u.email,
        role: displayRole,
        actualRole: u.role,
        status: u.isActive ? ("ACTIVE" as const) : ("BLOCKED" as const),
        sellerName: u.shops[0]?.name,
        joinedDate: u.createdAt.toISOString().split("T")[0],
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, password, role } = body;

    if (!fullName || (!phone && !email)) {
      return NextResponse.json(
        { success: false, message: "Họ tên và số điện thoại/email là bắt buộc" },
        { status: 400 }
      );
    }

    let prismaRole: Role = Role.CUSTOMER;
    if (role === "ADMIN") prismaRole = Role.ADMIN;
    else if (role === "STAFF") prismaRole = Role.STAFF;
    else if (role === "SELLER" || role === "PROVIDER") prismaRole = Role.PROVIDER;

    const newUser = await prisma.user.create({
      data: {
        fullName,
        phone: phone || null,
        email: email || null,
        password: password || "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
        role: prismaRole,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản người dùng mới thành công!",
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        role: role || "CUSTOMER",
        status: "ACTIVE",
        joinedDate: newUser.createdAt.toISOString().split("T")[0],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi tạo tài khoản";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status, role, fullName, phone, email } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      data.isActive = status === "ACTIVE";
    }
    if (role) {
      if (role === "SELLER") data.role = Role.PROVIDER;
      else if (role === "STAFF") data.role = Role.STAFF;
      else if (Object.values(Role).includes(role as Role)) {
        data.role = role as Role;
      }
    }
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone || null;
    if (email !== undefined) data.email = email || null;

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data,
      include: {
        shops: {
          select: { name: true },
          take: 1,
        },
      },
    });

    let displayRole: "ADMIN" | "SELLER" | "CUSTOMER" | "STAFF" = "CUSTOMER";
    if (updatedUser.role === "ADMIN") displayRole = "ADMIN";
    else if (updatedUser.role === "STAFF") displayRole = "STAFF";
    else if (updatedUser.role === "PROVIDER" || updatedUser.shops.length > 0) displayRole = "SELLER";

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản trong cơ sở dữ liệu thành công!",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName || "---",
        phone: updatedUser.phone || "---",
        email: updatedUser.email,
        role: displayRole,
        actualRole: updatedUser.role,
        status: updatedUser.isActive ? "ACTIVE" : "BLOCKED",
        sellerName: updatedUser.shops[0]?.name,
        joinedDate: updatedUser.createdAt.toISOString().split("T")[0],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("id"));

    if (!userId) {
      return NextResponse.json({ success: false, message: "Thiếu ID người dùng cần xóa" }, { status: 400 });
    }

    // Xóa mềm bằng cách vô hiệu hóa hoặc xóa cứng nếu không vướng ràng buộc
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa/vô hiệu hóa người dùng thành công khỏi cơ sở dữ liệu!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
