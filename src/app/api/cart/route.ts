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

// GET: Lấy danh sách item trong giỏ hàng của user
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: true, cart: null, items: [] });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                title: true,
                priceStart: true,
                images: true,
                duration: true,
                shop: {
                  select: { id: true, name: true, area: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ success: true, cart: null, items: [] });
    }

    const formattedItems = cart.items.map((item) => {
      let img = "";
      try {
        if (typeof item.service.images === "string") {
          const parsed = JSON.parse(item.service.images);
          img = Array.isArray(parsed) ? parsed[0] : parsed;
        } else if (Array.isArray(item.service.images)) {
          img = (item.service.images as string[])[0] || "";
        }
      } catch {
        img = "";
      }

      return {
        id: item.id,
        serviceId: item.service.id,
        title: item.service.title,
        priceStart: Number(item.service.priceStart),
        image: img || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
        shopName: item.service.shop.name,
        quantity: item.quantity,
        scheduledDate: item.scheduledDate ? item.scheduledDate.toISOString().split("T")[0] : "",
        note: item.note || "",
      };
    });

    return NextResponse.json({ success: true, cartId: cart.id, items: formattedItems });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Thêm dịch vụ vào giỏ hàng
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để lưu dịch vụ vào giỏ hàng" }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, quantity = 1, scheduledDate, note } = body;

    if (!serviceId) {
      return NextResponse.json({ success: false, message: "Thiếu mã dịch vụ" }, { status: 400 });
    }

    // Đảm bảo user có Cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Kiểm tra service có tồn tại không
    const service = await prisma.dichVu.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      return NextResponse.json({ success: false, message: "Dịch vụ không tồn tại" }, { status: 404 });
    }

    // Kiểm tra xem item đã có trong cart chưa
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        serviceId: Number(serviceId),
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + Number(quantity),
          scheduledDate: scheduledDate ? new Date(scheduledDate) : existingItem.scheduledDate,
          note: note !== undefined ? note : existingItem.note,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          serviceId: Number(serviceId),
          quantity: Number(quantity),
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          note: note || null,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Đã thêm vào giỏ hàng" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Xóa 1 item hoặc toàn bộ giỏ
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const clearAll = searchParams.get("clearAll");

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    if (clearAll === "true") {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      return NextResponse.json({ success: true, message: "Đã làm trống giỏ hàng" });
    }

    if (itemId) {
      await prisma.cartItem.deleteMany({
        where: {
          id: Number(itemId),
          cartId: cart.id,
        },
      });
      return NextResponse.json({ success: true, message: "Đã xóa khỏi giỏ hàng" });
    }

    return NextResponse.json({ success: false, message: "Tham số không hợp lệ" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
