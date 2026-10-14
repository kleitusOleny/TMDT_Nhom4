import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { ApprovalStatus } from "@/src/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.toLowerCase();

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      if (Object.values(ApprovalStatus).includes(status as ApprovalStatus)) {
        where.approvalStatus = status as ApprovalStatus;
      }
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { area: { contains: query } },
        { address: { contains: query } },
        { owner: { fullName: { contains: query } } },
        { owner: { phone: { contains: query } } },
        { owner: { email: { contains: query } } },
      ];
    }

    const shops = await prisma.shop.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    const formattedShops = shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      address: s.address || "Chưa cập nhật",
      area: s.area || "TP. Hồ Chí Minh",
      rating: s.rating,
      totalReviews: s.totalReviews,
      approvalStatus: s.approvalStatus,
      servicesCount: s._count.services,
      ownerId: s.ownerId,
      ownerName: s.owner.fullName || "Chưa đặt tên",
      ownerPhone: s.owner.phone || "---",
      ownerEmail: s.owner.email,
      createdAt: s.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({ success: true, shops: formattedShops });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerId, area, address, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Tên nhà cung cấp là bắt buộc" }, { status: 400 });
    }

    let finalOwnerId = Number(ownerId);
    if (!finalOwnerId) {
      // Tìm hoặc tạo một user provider mặc định
      const defaultOwner = await prisma.user.findFirst({
        where: { role: "PROVIDER" },
      });
      finalOwnerId = defaultOwner?.id || 1;
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newShop = await prisma.shop.create({
      data: {
        name,
        slug,
        ownerId: finalOwnerId,
        area: area || "TP. Hồ Chí Minh",
        address: address || "Hồ Chí Minh",
        description: description || `Nhà cung cấp dịch vụ chuyên nghiệp ${name}`,
        approvalStatus: "APPROVED",
        rating: 5.0,
      },
      include: {
        owner: { select: { fullName: true, phone: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo nhà cung cấp mới thành công!",
      shop: {
        id: newShop.id,
        name: newShop.name,
        slug: newShop.slug,
        address: newShop.address,
        area: newShop.area,
        rating: newShop.rating,
        totalReviews: 0,
        approvalStatus: newShop.approvalStatus,
        servicesCount: 0,
        ownerId: newShop.ownerId,
        ownerName: newShop.owner.fullName || "Chưa đặt tên",
        ownerPhone: newShop.owner.phone || "---",
        ownerEmail: newShop.owner.email,
        createdAt: newShop.createdAt.toISOString().split("T")[0],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, name, area, address, description, approvalStatus, rating } = body;

    if (!shopId) {
      return NextResponse.json({ success: false, message: "Thiếu ID gian hàng" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (area !== undefined) data.area = area;
    if (address !== undefined) data.address = address;
    if (description !== undefined) data.description = description;
    if (approvalStatus && Object.values(ApprovalStatus).includes(approvalStatus as ApprovalStatus)) {
      data.approvalStatus = approvalStatus as ApprovalStatus;
    }
    if (rating !== undefined && !isNaN(Number(rating))) {
      data.rating = Number(rating);
    }

    const updated = await prisma.shop.update({
      where: { id: Number(shopId) },
      data,
      include: {
        owner: { select: { fullName: true, phone: true, email: true } },
        _count: { select: { services: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin nhà cung cấp thành công!",
      shop: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        address: updated.address,
        area: updated.area,
        rating: updated.rating,
        totalReviews: updated.totalReviews,
        approvalStatus: updated.approvalStatus,
        servicesCount: updated._count.services,
        ownerId: updated.ownerId,
        ownerName: updated.owner.fullName || "---",
        ownerPhone: updated.owner.phone || "---",
        ownerEmail: updated.owner.email,
        createdAt: updated.createdAt.toISOString().split("T")[0],
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
    const shopId = Number(searchParams.get("id"));

    if (!shopId) {
      return NextResponse.json({ success: false, message: "Thiếu ID nhà cung cấp cần xóa" }, { status: 400 });
    }

    try {
      await prisma.shop.delete({ where: { id: shopId } });
    } catch {
      await prisma.shop.update({
        where: { id: shopId },
        data: { approvalStatus: "REJECTED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa/vô hiệu hóa nhà cung cấp thành công khỏi cơ sở dữ liệu!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
