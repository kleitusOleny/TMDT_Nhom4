import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

async function getAdminOrProviderUser(req: NextRequest) {
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
        select: { id: true, role: true, shops: { select: { id: true, name: true } } },
      });
      if (u) return u;
    }
  }

  if (!userId) return null;

  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, shops: { select: { id: true, name: true } } },
  });
}

// 1. GET: Lấy danh sách mã giảm giá cho Admin / Người bán (Seller)
export async function GET(req: NextRequest) {
  try {
    const user = await getAdminOrProviderUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PROVIDER")) {
      return NextResponse.json(
        { success: false, message: "Không có quyền truy cập quản lý mã giảm giá" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get("shopId");
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q")?.trim() || "";

    const where: Record<string, unknown> = {};

    if (user.role === "PROVIDER") {
      const userShopIds = user.shops?.map((s) => s.id) || [];
      if (shopIdParam && shopIdParam !== "ALL") {
        const parsed = parseInt(shopIdParam, 10);
        if (userShopIds.includes(parsed)) {
          where.shopId = parsed;
        } else {
          where.shopId = { in: userShopIds };
        }
      } else {
        where.shopId = { in: userShopIds };
      }
    } else {
      // ADMIN
      if (shopIdParam && shopIdParam !== "ALL") {
        if (shopIdParam === "GLOBAL") {
          where.scope = "GLOBAL";
        } else {
          const parsed = parseInt(shopIdParam, 10);
          if (!isNaN(parsed)) where.shopId = parsed;
        }
      }
    }

    if (statusParam && statusParam !== "ALL") {
      const now = new Date();
      if (statusParam === "ACTIVE") {
        where.isActive = true;
        where.startDate = { lte: now };
        where.endDate = { gte: now };
      } else if (statusParam === "EXPIRED") {
        where.endDate = { lt: now };
      } else if (statusParam === "PAUSED") {
        where.isActive = false;
      }
    }

    if (query) {
      where.OR = [
        { code: { contains: query } },
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        shop: {
          select: { id: true, name: true },
        },
      },
    });

    const now = new Date();
    const formatted = promotions.map((p) => {
      let currentStatus: "ACTIVE" | "EXPIRED" | "PAUSED" | "UPCOMING" = "ACTIVE";
      if (!p.isActive) {
        currentStatus = "PAUSED";
      } else if (p.endDate < now) {
        currentStatus = "EXPIRED";
      } else if (p.startDate > now) {
        currentStatus = "UPCOMING";
      }

      return {
        id: p.id,
        code: p.code,
        title: p.title,
        description: p.description,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        minOrderValue: Number(p.minOrderValue),
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        usageLimit: p.usageLimit,
        usedCount: p.usedCount,
        isActive: p.isActive,
        status: currentStatus,
        scope: p.scope,
        shopId: p.shopId,
        shopName: p.shop?.name || (p.scope === "GLOBAL" ? "Toàn sàn CleanMate" : null),
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, promotions: formatted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 2. POST: Tạo mới mã giảm giá
export async function POST(req: NextRequest) {
  try {
    const user = await getAdminOrProviderUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PROVIDER")) {
      return NextResponse.json(
        { success: false, message: "Không có quyền tạo mã giảm giá" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code,
      title,
      description,
      discountType = "PERCENT",
      discountValue,
      minOrderValue = 0,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      scope = "GLOBAL",
      shopId,
    } = body;

    if (!code || !code.trim() || !title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Mã code và tiêu đề không được để trống" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, message: "Mã code chỉ được chứa chữ cái, số, gạch nối (3-30 ký tự)" },
        { status: 400 }
      );
    }

    const existing = await prisma.promotion.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Mã [${cleanCode}] đã tồn tại trong hệ thống` },
        { status: 400 }
      );
    }

    const parsedDiscount = parseFloat(discountValue);
    if (isNaN(parsedDiscount) || parsedDiscount <= 0) {
      return NextResponse.json(
        { success: false, message: "Giá trị giảm giá phải lớn hơn 0" },
        { status: 400 }
      );
    }

    if (discountType === "PERCENT" && parsedDiscount > 100) {
      return NextResponse.json(
        { success: false, message: "Phần trăm giảm giá không được vượt quá 100%" },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (end <= start) {
      return NextResponse.json(
        { success: false, message: "Thời gian kết thúc phải sau thời gian bắt đầu" },
        { status: 400 }
      );
    }

    let finalScope: "GLOBAL" | "SHOP" = scope === "SHOP" ? "SHOP" : "GLOBAL";
    let finalShopId: number | null = shopId ? parseInt(shopId, 10) : null;

    if (user.role === "PROVIDER") {
      finalScope = "SHOP";
      const userShopIds = user.shops?.map((s) => s.id) || [];
      if (!finalShopId || !userShopIds.includes(finalShopId)) {
        finalShopId = userShopIds[0] || null;
      }
      if (!finalShopId) {
        return NextResponse.json(
          { success: false, message: "Bạn chưa sở hữu gian hàng nào để tạo voucher" },
          { status: 400 }
        );
      }
    }

    const created = await prisma.promotion.create({
      data: {
        code: cleanCode,
        title: title.trim(),
        description: description?.trim() || null,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENT",
        discountValue: parsedDiscount,
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: start,
        endDate: end,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        scope: finalScope,
        shopId: finalScope === "SHOP" ? finalShopId : null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo mã giảm giá [${created.code}] thành công!`,
      promotion: created,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 3. PATCH: Cập nhật hoặc Bật/Tắt trạng thái mã giảm giá
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAdminOrProviderUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PROVIDER")) {
      return NextResponse.json(
        { success: false, message: "Không có quyền chỉnh sửa mã giảm giá" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, isActive, title, description, minOrderValue, maxDiscount, endDate, usageLimit } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID mã giảm giá cần cập nhật" },
        { status: 400 }
      );
    }

    const promo = await prisma.promotion.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá" },
        { status: 404 }
      );
    }

    // Nếu là PROVIDER thì chỉ được sửa voucher của shop mình
    if (user.role === "PROVIDER") {
      const userShopIds = user.shops?.map((s) => s.id) || [];
      if (!promo.shopId || !userShopIds.includes(promo.shopId)) {
        return NextResponse.json(
          { success: false, message: "Bạn không có quyền chỉnh sửa voucher của gian hàng khác" },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (minOrderValue !== undefined) updateData.minOrderValue = parseFloat(minOrderValue) || 0;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (endDate) updateData.endDate = new Date(endDate);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit, 10) : null;

    const updated = await prisma.promotion.update({
      where: { id: promo.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      promotion: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 4. DELETE: Xóa mã giảm giá
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAdminOrProviderUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PROVIDER")) {
      return NextResponse.json(
        { success: false, message: "Không có quyền xóa mã giảm giá" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID mã giảm giá cần xóa" },
        { status: 400 }
      );
    }

    const promoId = parseInt(idParam, 10);
    const promo = await prisma.promotion.findUnique({
      where: { id: promoId },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá" },
        { status: 404 }
      );
    }

    if (user.role === "PROVIDER") {
      const userShopIds = user.shops?.map((s) => s.id) || [];
      if (!promo.shopId || !userShopIds.includes(promo.shopId)) {
        return NextResponse.json(
          { success: false, message: "Bạn không có quyền xóa voucher của gian hàng khác" },
          { status: 403 }
        );
      }
    }

    await prisma.promotion.delete({
      where: { id: promoId },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa mã giảm giá [${promo.code}] thành công`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
