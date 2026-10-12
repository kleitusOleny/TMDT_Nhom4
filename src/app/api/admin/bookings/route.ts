import { NextRequest, NextResponse } from "next/server";
import { initialBookings, BookingRecord } from "@/src/lib/admin-data";

const bookingsStore: BookingRecord[] = [...initialBookings];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sellerId = searchParams.get("sellerId");
  const query = searchParams.get("q")?.toLowerCase();

  let list = bookingsStore;
  if (status && status !== "ALL") {
    list = list.filter((b) => b.status === status);
  }
  if (sellerId) {
    list = list.filter((b) => b.sellerId === parseInt(sellerId, 10));
  }
  if (query) {
    list = list.filter(
      (b) =>
        b.id.toLowerCase().includes(query) ||
        b.customerName.toLowerCase().includes(query) ||
        b.customerPhone.includes(query) ||
        b.serviceName.toLowerCase().includes(query) ||
        b.sellerName.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({ success: true, bookings: list });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status, assignedStaff } = body;

    const idx = bookingsStore.findIndex((b) => b.id === bookingId);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    if (status) bookingsStore[idx].status = status;
    if (assignedStaff !== undefined) bookingsStore[idx].assignedStaff = assignedStaff;

    return NextResponse.json({
      success: true,
      message: "Cập nhật đơn đặt dịch vụ thành công!",
      booking: bookingsStore[idx],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
