import React from "react";
import { UserRecord, ProviderRecord, ServiceRecord, BookingRecord } from "@/src/lib/admin-data";
import { X, User, Building2, Plus, Trash2 } from "lucide-react";

// Format VNĐ
const formatVND = (num: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

// 1. MODAL CHI TIẾT ĐƠN HÀNG
export function BookingDetailModal({
  booking,
  onClose,
  onUpdateStatus,
}: {
  booking: BookingRecord & {
    customerEmail?: string | null;
    note?: string | null;
    tipAmount?: number;
    paymentStatus?: string;
    transactionId?: string | null;
    beforeImages?: string[];
    afterImages?: string[];
    cancellationReason?: string | null;
  };
  onClose: () => void;
  onUpdateStatus: (bookingId: string, status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                {booking.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  booking.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700"
                    : booking.status === "IN_PROGRESS"
                    ? "bg-blue-50 text-blue-700"
                    : booking.status === "CONFIRMED"
                    ? "bg-purple-50 text-purple-700"
                    : booking.status === "PENDING"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {booking.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{booking.serviceName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cột 1: Khách hàng & Lịch hẹn */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" /> Thông tin Khách hàng
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-semibold text-slate-800">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-semibold text-slate-800 font-mono">{booking.customerPhone}</span>
            </div>
            {booking.customerEmail && (
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{booking.customerEmail}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-1">Địa chỉ dọn dẹp:</span>
              <span className="font-medium text-slate-800">{booking.address}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Thời gian hẹn:</span>
              <span className="font-semibold text-slate-800">
                {booking.bookingDate} ({booking.bookingTime})
              </span>
            </div>
            {booking.note && (
              <div className="pt-1">
                <span className="text-slate-500 block mb-0.5">Ghi chú của khách:</span>
                <p className="italic text-slate-600 bg-white p-2 rounded-lg border border-slate-200">{booking.note}</p>
              </div>
            )}
          </div>

          {/* Cột 2: Đối tác & Thanh toán */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" /> Gian hàng & Thanh toán
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-500">Đối tác phụ trách:</span>
              <span className="font-semibold text-blue-600">{booking.sellerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-semibold text-slate-800">{booking.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="font-semibold text-emerald-600">{booking.paymentStatus || "Đã xác nhận"}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng tiền thu khách:</span>
                <span className="font-bold text-slate-900 text-sm">{formatVND(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Chiết khấu sàn (15%):</span>
                <span>+{formatVND(booking.commissionFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tiền shop thực nhận (85%):</span>
                <span className="font-semibold text-slate-800">{formatVND(booking.sellerEarnings)}</span>
              </div>
              {booking.tipAmount ? (
                <div className="flex justify-between text-amber-600">
                  <span>Tiền Tip (nhân viên nhận):</span>
                  <span>+{formatVND(booking.tipAmount)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Nghiệm thu hình ảnh nếu có */}
        {((booking.beforeImages && booking.beforeImages.length > 0) || (booking.afterImages && booking.afterImages.length > 0)) && (
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">Hình ảnh nghiệm thu công trình</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Ảnh trước khi dọn:</span>
                <div className="flex gap-2">
                  {booking.beforeImages?.map((img, idx) => (
                    <img key={idx} src={img} alt="Before" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Ảnh sau khi dọn:</span>
                <div className="flex gap-2">
                  {booking.afterImages?.map((img, idx) => (
                    <img key={idx} src={img} alt="After" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nút cập nhật trạng thái nhanh */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Đổi trạng thái:</span>
            <select
              value={booking.status}
              onChange={(e) => onUpdateStatus(booking.id, e.target.value as "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED")}
              className="bg-slate-100 border border-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg text-slate-800 outline-none cursor-pointer"
            >
              <option value="PENDING">PENDING (Chờ duyệt)</option>
              <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Đang dọn dẹp)</option>
              <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
              <option value="CANCELLED">CANCELLED (Hủy đơn)</option>
            </select>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. MODAL THÊM / SỬA NGƯỜI DÙNG & PHÂN QUYỀN RBAC
export function UserFormModal({
  user,
  onClose,
  onSubmit,
}: {
  user?: UserRecord | null;
  onClose: () => void;
  onSubmit: (data: { userId?: number; fullName: string; phone: string; email: string; role: string; status?: string }) => void;
}) {
  const [fullName, setFullName] = React.useState(user?.fullName || "");
  const [phone, setPhone] = React.useState(user?.phone !== "---" ? user?.phone || "" : "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [role, setRole] = React.useState(user?.actualRole || user?.role || "CUSTOMER");
  const [status, setStatus] = React.useState(user?.status || "ACTIVE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: user?.id,
      fullName,
      phone,
      email,
      role,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">
            {user ? "Chỉnh Sửa & Phân Quyền Tài Khoản" : "Thêm Tài Khoản Mới"}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@cleanmate.vn"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Phân quyền RBAC */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vai trò (RBAC Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer font-medium"
            >
              <option value="CUSTOMER">Khách hàng (CUSTOMER) - Đặt dịch vụ & đánh giá</option>
              <option value="STAFF">Nhân viên sàn (STAFF) - Hỗ trợ vé & nghiệm thu</option>
              <option value="PROVIDER">Nhà cung cấp / Đối tác (PROVIDER) - Quản lý dịch vụ & đơn</option>
              <option value="ADMIN">Quản trị viên tối cao (ADMIN) - Toàn quyền hệ thống</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trạng thái hoạt động
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "BLOCKED")}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
              <option value="BLOCKED">Khóa tài khoản (BLOCKED)</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
            >
              {user ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. MODAL THÊM / SỬA NHÀ CUNG CẤP (PROVIDER)
export function ProviderFormModal({
  provider,
  onClose,
  onSubmit,
}: {
  provider?: ProviderRecord | null;
  onClose: () => void;
  onSubmit: (data: {
    shopId?: number;
    name: string;
    area: string;
    address: string;
    description: string;
    approvalStatus: string;
  }) => void;
}) {
  const [name, setName] = React.useState(provider?.name || "");
  const [area, setArea] = React.useState(provider?.area || "TP. Hồ Chí Minh");
  const [address, setAddress] = React.useState(provider?.address || "");
  const [description, setDescription] = React.useState(provider?.description || "");
  const [approvalStatus, setApprovalStatus] = React.useState(provider?.approvalStatus || "APPROVED");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      shopId: provider?.id,
      name,
      area,
      address,
      description,
      approvalStatus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">
            {provider ? "Chỉnh Sửa Nhà Cung Cấp" : "Đăng Ký Nhà Cung Cấp Mới"}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên doanh nghiệp / Gian hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Công ty TNHH Vệ sinh A..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Khu vực hoạt động <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Quận 1, 3, Bình Thạnh (TP.HCM)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Địa chỉ văn phòng
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Nguyễn Văn Cừ, Quận 5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Giới thiệu ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả năng lực, trang thiết bị..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trạng thái kiểm duyệt
            </label>
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value as "APPROVED" | "PENDING" | "REJECTED")}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
              <option value="PENDING">Đang chờ xét duyệt (PENDING)</option>
              <option value="REJECTED">Từ chối hợp tác (REJECTED)</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
            >
              {provider ? "Cập nhật" : "Đăng ký mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. MODAL CHỈNH SỬA DỊCH VỤ
export function ServiceEditModal({
  service,
  shopsList,
  onClose,
  onSubmit,
}: {
  service: ServiceRecord;
  shopsList: { id: number; name: string }[];
  onClose: () => void;
  onSubmit: (data: {
    serviceId?: number;
    name: string;
    category: string;
    sellerId: number;
    price: number;
    unit: string;
    status: string;
    description?: string;
    images?: string[];
    pricingTable?: {
      id: string;
      title: string;
      sub: string;
      price: number;
      unit: string;
    }[];
  }) => void;
}) {
  const [name, setName] = React.useState(service.name);
  const [category, setCategory] = React.useState(service.category);
  const [sellerId, setSellerId] = React.useState(service.sellerId);
  const [price, setPrice] = React.useState(service.price.toString());
  const [unit, setUnit] = React.useState(service.unit);
  const [status, setStatus] = React.useState(service.status);
  const [description, setDescription] = React.useState(service.description || "");

  // Quản lý danh sách hình ảnh
  const initialImages = Array.isArray(service.images) && service.images.length > 0
    ? service.images
    : ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"];
  const [images, setImages] = React.useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = React.useState("");

  // Quản lý danh sách các tùy chọn gói bảng giá (options)
  const initialOptions = Array.isArray(service.pricingTable) && service.pricingTable.length > 0
    ? service.pricingTable
    : [
        { id: "opt-1", title: "Gói cơ bản", sub: "1 người dọn • 2 giờ", price: service.price || 200000, unit: "/gói" },
        { id: "opt-2", title: "Gói nâng cao", sub: "2 người dọn • 3.5 giờ", price: (service.price || 200000) * 1.8, unit: "/gói" },
      ];
  const [options, setOptions] = React.useState(initialOptions);

  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImages([...images, trimmed]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}`;
    setOptions([
      ...options,
      {
        id: newId,
        title: `Tùy chọn ${options.length + 1}`,
        sub: "Mô tả chi tiết tùy chọn",
        price: Number(price) || 200000,
        unit: "/gói",
      },
    ]);
  };

  const handleUpdateOption = (index: number, field: string, val: string | number) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      serviceId: service.id > 0 ? service.id : undefined,
      name,
      category,
      sellerId: Number(sellerId),
      price: Number(price),
      unit,
      status,
      description,
      images,
      pricingTable: options,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">
            {service.id > 0 ? `Chỉnh Sửa Dịch Vụ #${service.id}` : "Thêm Dịch Vụ Mới"}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tên dịch vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Dọn dẹp nhà ở theo giờ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nhà cung cấp phụ trách
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer font-medium"
              >
                {shopsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (id: {s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nhóm danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceRecord["category"])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer font-medium"
              >
                <option value="home">Vệ sinh nhà ở</option>
                <option value="office">Vệ sinh văn phòng</option>
                <option value="industrial">Sau xây dựng</option>
                <option value="sofa">Giặt sofa & nệm thảm</option>
                <option value="ac">Vệ sinh máy lạnh</option>
                <option value="glass">Vệ sinh kính</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Giá khởi điểm (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Đơn vị tính
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="gói, giờ, phòng..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả dịch vụ
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt dịch vụ, quy trình phục vụ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          {/* QUẢN LÝ HÌNH ẢNH DỊCH VỤ */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Danh sách hình ảnh ({images.length})</span>
              </label>
              <span className="text-[11px] text-slate-400">URL hình ảnh trực tuyến</span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Dán URL hình ảnh (vd: https://images.unsplash.com/...)"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition cursor-pointer"
              >
                Thêm ảnh
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-20 bg-white">
                    <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      title="Xóa ảnh"
                      className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-md p-1 opacity-80 hover:opacity-100 transition cursor-pointer shadow-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        Ảnh bìa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUẢN LÝ DANH SÁCH CÁC OPTIONS (BẢNG GIÁ DỊCH VỤ) */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 uppercase tracking-wider block">
                  Danh sách gói tùy chọn (Options / Bảng giá)
                </label>
                <span className="text-[11px] text-slate-500">
                  Người dùng có thể chọn các gói kích thước/thời lượng này khi đặt dịch vụ
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm tùy chọn</span>
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                    title="Xóa tùy chọn này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pr-6">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Tên gói</label>
                      <input
                        type="text"
                        value={opt.title}
                        onChange={(e) => handleUpdateOption(idx, "title", e.target.value)}
                        placeholder="Tên gói (vd: Gói 2 giờ, Căn hộ 2PN)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Giá gói (VNĐ)</label>
                      <input
                        type="number"
                        value={opt.price}
                        onChange={(e) => handleUpdateOption(idx, "price", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-mono outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Đơn vị</label>
                      <input
                        type="text"
                        value={opt.unit}
                        onChange={(e) => handleUpdateOption(idx, "unit", e.target.value)}
                        placeholder="/gói, /giờ"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={opt.sub}
                      onChange={(e) => handleUpdateOption(idx, "sub", e.target.value)}
                      placeholder="Mô tả chi tiết (vd: 1 người dọn • 2 giờ • đã bao gồm dụng cụ)"
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trạng thái dịch vụ
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ServiceRecord["status"])}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer font-medium"
            >
              <option value="APPROVED">Đã duyệt (Active)</option>
              <option value="PENDING">Chờ duyệt (Pending)</option>
              <option value="INACTIVE">Tạm ẩn (Inactive)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
            >
              {service.id > 0 ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. MODAL TẠO ĐƠN HÀNG MỚI
export function CreateBookingModal({
  servicesList,
  usersList,
  onClose,
  onSubmit,
}: {
  servicesList: ServiceRecord[];
  usersList: UserRecord[];
  onClose: () => void;
  onSubmit: (data: {
    serviceId: number;
    customerId: number;
    scheduledDate: string;
    address: string;
    note: string;
    totalPrice: number;
    paymentMethod: string;
  }) => void;
}) {
  const [serviceId, setServiceId] = React.useState<number>(servicesList[0]?.id || 1);
  const [customerId, setCustomerId] = React.useState<number>(usersList[0]?.id || 1);
  const [scheduledDate, setScheduledDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = React.useState("09:00");
  const [address, setAddress] = React.useState("");
  const [note, setNote] = React.useState("");
  const [totalPrice, setTotalPrice] = React.useState(servicesList[0]?.price.toString() || "250000");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");

  // Tự động điền giá khi đổi dịch vụ
  const handleServiceChange = (id: number) => {
    setServiceId(id);
    const selected = servicesList.find((s) => s.id === id);
    if (selected) {
      setTotalPrice(selected.price.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    const fullDateTime = `${scheduledDate}T${scheduledTime}:00.000Z`;
    onSubmit({
      serviceId,
      customerId,
      scheduledDate: fullDateTime,
      address,
      note,
      totalPrice: Number(totalPrice),
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">Tạo Đơn Đặt Dịch Vụ Mới</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Gói dịch vụ <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => handleServiceChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            >
              {servicesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {formatVND(s.price)} ({s.sellerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Khách hàng đặt lịch
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ngày thực hiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Giờ thực hiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Địa chỉ phục vụ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: Căn hộ A12-04 Masteri Thảo Điền, TP. Thủ Đức"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tổng thanh toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phương thức
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="CASH">Tiền mặt (COD)</option>
                <option value="VNPAY">VNPay QR</option>
                <option value="MOMO">Ví MoMo</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú công việc
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yêu cầu mang theo máy hút bụi công suất lớn..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
            >
              Tạo đơn ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
