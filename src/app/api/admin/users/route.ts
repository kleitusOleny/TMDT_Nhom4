import { NextRequest, NextResponse } from "next/server";
import { initialUsers, UserRecord } from "@/src/lib/admin-data";

// Bộ nhớ in-memory giả lập cho phiên làm việc
const usersStore: UserRecord[] = [...initialUsers];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const query = searchParams.get("q")?.toLowerCase();

  let filtered = usersStore;
  if (role && role !== "ALL") {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (query) {
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.phone.includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.sellerName && u.sellerName.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({ success: true, users: filtered });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status, role } = body;

    const userIndex = usersStore.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    if (status) usersStore[userIndex].status = status;
    if (role) usersStore[userIndex].role = role;

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công!",
      user: usersStore[userIndex],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
