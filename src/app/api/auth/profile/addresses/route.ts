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

// GET: Lấy danh sách địa chỉ của người dùng đang đăng nhập
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Thêm mới một địa chỉ
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverName, phone, detailAddress, province, district, ward, isDefault } = body;

    if (!receiverName || !phone || !detailAddress) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập Tên người nhận, Số điện thoại và Địa chỉ chi tiết." },
        { status: 400 }
      );
    }

    // Đếm số lượng địa chỉ hiện có của user
    let addressCount = 0;
    try {
      if (prisma.userAddress && typeof prisma.userAddress.count === "function") {
        addressCount = await prisma.userAddress.count({ where: { userId } });
      } else if (prisma.userAddress && typeof prisma.userAddress.findMany === "function") {
        const userAddrs = await prisma.userAddress.findMany({ where: { userId }, select: { id: true } });
        addressCount = userAddrs.length;
      }
    } catch (countErr) {
      console.warn("[Addresses API] Warning khi đếm địa chỉ:", countErr);
    }

    const shouldBeDefault = Boolean(isDefault) || addressCount === 0;

    if (shouldBeDefault && prisma.userAddress) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId,
        receiverName: String(receiverName).trim(),
        phone: String(phone).trim(),
        detailAddress: String(detailAddress).trim(),
        province: province ? String(province).trim() : null,
        district: district ? String(district).trim() : null,
        ward: ward ? String(ward).trim() : null,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thêm địa chỉ mới thành công!",
      address: newAddress,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PUT / PATCH: Cập nhật địa chỉ hoặc đặt làm mặc định
export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { id, receiverName, phone, detailAddress, province, district, ward, isDefault } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Thiếu ID địa chỉ" }, { status: 400 });
    }

    const existingAddress = await prisma.userAddress.findFirst({
      where: { id: Number(id), userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ success: false, message: "Không tìm thấy địa chỉ này" }, { status: 404 });
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (receiverName !== undefined) updateData.receiverName = String(receiverName).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (detailAddress !== undefined) updateData.detailAddress = String(detailAddress).trim();
    if (province !== undefined) updateData.province = province ? String(province).trim() : null;
    if (district !== undefined) updateData.district = district ? String(district).trim() : null;
    if (ward !== undefined) updateData.ward = ward ? String(ward).trim() : null;
    if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);

    const updatedAddress = await prisma.userAddress.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: isDefault && Object.keys(updateData).length === 1 ? "Đã đặt làm địa chỉ mặc định!" : "Cập nhật địa chỉ thành công!",
      address: updatedAddress,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Xóa địa chỉ
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const addressId = Number(searchParams.get("id"));

    if (!addressId) {
      return NextResponse.json({ success: false, message: "Thiếu ID địa chỉ cần xóa" }, { status: 400 });
    }

    const existingAddress = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ success: false, message: "Không tìm thấy địa chỉ" }, { status: 404 });
    }

    const wasDefault = existingAddress.isDefault;

    await prisma.userAddress.delete({
      where: { id: addressId },
    });

    // Nếu vừa xóa địa chỉ mặc định, set địa chỉ gần nhất làm mặc định
    if (wasDefault) {
      const remainingAddress = await prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (remainingAddress) {
        await prisma.userAddress.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa địa chỉ thành công!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
