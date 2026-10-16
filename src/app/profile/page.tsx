"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Building2,
  Sparkles,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Check,
  Star,
  ShoppingBag,
  Headphones,
  ChevronRight,
  Clock,
  ExternalLink,
} from "lucide-react";

interface AddressItem {
  id: number;
  receiverName: string;
  phone: string;
  detailAddress: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  isDefault: boolean;
}

interface UserProfile {
  id: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  image: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  shops?: { id: number; name: string; slug: string; approvalStatus: string }[];
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [image, setImage] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Tab điều hướng bên trái: "info" | "address" | "orders" | "support"
  const [activeTab, setActiveTab] = useState<"info" | "address" | "orders" | "support">("info");

  // Address states
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  // Bookings / Lịch sử đơn hàng states
  interface BookingHistoryItem {
    id: number;
    bookingCode: string;
    serviceId: number;
    serviceTitle: string;
    serviceImage: string;
    shopName: string;
    scheduledDate: string;
    address: string;
    note: string | null;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    hasReviewed: boolean;
    rating: number | null;
    reviewComment: string | null;
  }
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Address modal form
  const [receiverName, setReceiverName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [addressModalError, setAddressModalError] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Hàm tải danh sách đơn hàng
  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await fetch("/api/auth/profile/bookings");
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử đơn hàng:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Hàm tải danh sách địa chỉ
  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await fetch("/api/auth/profile/addresses");
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách địa chỉ:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.authenticated || !data.user) {
          router.replace("/login");
          return;
        }

        const u = data.user;
        setProfile(u);
        setFullName(u.fullName || "");
        setPhone(u.phone || "");
        setImage(u.image || "");
        if (u.dateOfBirth) {
          setDateOfBirth(new Date(u.dateOfBirth).toISOString().split("T")[0]);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin cá nhân:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
    loadAddresses();
    loadBookings();
  }, [router]);

  // Mở modal thêm địa chỉ
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setReceiverName(fullName || "");
    setAddressPhone(phone || "");
    setDetailAddress("");
    setProvince("");
    setDistrict("");
    setWard("");
    setIsDefaultAddress(addresses.length === 0);
    setAddressModalError("");
    setIsAddressModalOpen(true);
  };

  // Mở modal sửa địa chỉ
  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddress(addr);
    setReceiverName(addr.receiverName);
    setAddressPhone(addr.phone);
    setDetailAddress(addr.detailAddress);
    setProvince(addr.province || "");
    setDistrict(addr.district || "");
    setWard(addr.ward || "");
    setIsDefaultAddress(addr.isDefault);
    setAddressModalError("");
    setIsAddressModalOpen(true);
  };

  // Lưu địa chỉ (Thêm mới hoặc Sửa)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressModalError("");

    if (!receiverName.trim() || !addressPhone.trim() || !detailAddress.trim()) {
      setAddressModalError("Vui lòng điền Họ tên, Số điện thoại và Địa chỉ chi tiết.");
      return;
    }

    try {
      setIsSavingAddress(true);
      const url = "/api/auth/profile/addresses";
      const method = editingAddress ? "PUT" : "POST";
      const body = {
        id: editingAddress?.id,
        receiverName: receiverName.trim(),
        phone: addressPhone.trim(),
        detailAddress: detailAddress.trim(),
        province: province.trim() || null,
        district: district.trim() || null,
        ward: ward.trim() || null,
        isDefault: isDefaultAddress,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Không thể lưu địa chỉ.");
      }

      setIsAddressModalOpen(false);
      setSuccessMessage(editingAddress ? "Đã cập nhật địa chỉ thành công!" : "Đã thêm địa chỉ mới thành công!");
      await loadAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setAddressModalError(msg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Đặt làm địa chỉ mặc định
  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const res = await fetch("/api/auth/profile/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addressId, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Đã đặt làm địa chỉ mặc định!");
        await loadAddresses();
      }
    } catch (err) {
      console.error("Lỗi đặt địa chỉ mặc định:", err);
    }
  };

  // Xóa địa chỉ
  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này khỏi danh sách?")) return;

    try {
      const res = await fetch(`/api/auth/profile/addresses?id=${addressId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Đã xóa địa chỉ thành công!");
        await loadAddresses();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Lỗi xóa địa chỉ:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Vui lòng nhập Họ và tên.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Mật khẩu xác nhận không trùng khớp.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          dateOfBirth: dateOfBirth || null,
          image: image.trim() || null,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Không thể cập nhật thông tin.");
      }

      setProfile(data.user);
      setSuccessMessage(data?.message || "Cập nhật thông tin cá nhân thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi, vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header currentPath="/profile" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Đang tải thông tin tài khoản...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const roleBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
    ADMIN: { label: "Quản trị viên sàn", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
    PROVIDER: { label: "Nhà cung cấp / Đối tác", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    STAFF: { label: "Nhân viên dịch vụ", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    CUSTOMER: { label: "Khách hàng", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  };

  const currentRoleInfo = roleBadgeMap[profile?.role || "CUSTOMER"] || roleBadgeMap.CUSTOMER;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Header currentPath="/profile" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner tiêu đề trang */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thông tin cá nhân
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quản lý hồ sơ cá nhân, số điện thoại liên hệ và bảo mật mật khẩu tài khoản CleanMate.
            </p>
          </div>

          {profile?.role === "PROVIDER" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition self-start sm:self-auto"
            >
              <Building2 className="w-4 h-4" />
              <span>Vào Kênh Quản Trị Gian Hàng</span>
            </Link>
          )}

          {profile?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-500/20 transition self-start sm:self-auto"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vào Bảng Quản Trị Admin</span>
            </Link>
          )}
        </div>

        {/* Thông báo kết quả */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: THẺ TỔNG QUAN & MENU TAB ĐIỀU HƯỚNG (4 CỘT) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center">
              {/* Avatar hình tròn */}
              <div className="relative inline-block mx-auto mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-blue-500/30 overflow-hidden border-4 border-white">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : profile?.fullName ? (
                    profile.fullName[0].toUpperCase()
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 truncate">
                {profile?.fullName || "Người dùng CleanMate"}
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.email || "Chưa thiết lập email"}</p>

              {/* Huy hiệu vai trò */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border border-slate-200">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentRoleInfo.bg} ${currentRoleInfo.text}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
            </div>

            {/* DANH SÁCH 4 TAB ĐIỀU HƯỚNG BÊN TRÁI */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs space-y-1">
              {/* Tab 1: Thông tin */}
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "info"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className={`w-4 h-4 ${activeTab === "info" ? "text-white" : "text-blue-600"}`} />
                  <span>Thông tin cá nhân</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "info" ? "text-blue-200" : "text-slate-400"}`} />
              </button>

              {/* Tab 2: Địa chỉ */}
              <button
                type="button"
                onClick={() => setActiveTab("address")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "address"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className={`w-4 h-4 ${activeTab === "address" ? "text-white" : "text-purple-600"}`} />
                  <span>Địa chỉ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "address" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {addresses.length}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${activeTab === "address" ? "text-purple-200" : "text-slate-400"}`} />
                </div>
              </button>

              {/* Tab 3: Lịch sử đơn hàng */}
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className={`w-4 h-4 ${activeTab === "orders" ? "text-white" : "text-emerald-600"}`} />
                  <span>Lịch sử đơn hàng</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === "orders" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {bookings.length}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${activeTab === "orders" ? "text-emerald-200" : "text-slate-400"}`} />
                </div>
              </button>

              {/* Tab 4: Hỗ trợ */}
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "support"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className={`w-4 h-4 ${activeTab === "support" ? "text-white" : "text-amber-600"}`} />
                  <span>Hỗ trợ</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "support" ? "text-amber-200" : "text-slate-400"}`} />
              </button>
            </div>

            {/* Khối gian hàng đối tác nếu có */}
            {profile?.shops && profile.shops.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gian hàng phụ trách</h3>
                </div>
                <div className="space-y-2">
                  {profile.shops.map((s) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">Mã shop: #{s.id}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {s.approvalStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: NỘI DUNG THEO TAB ĐANG CHỌN (8 CỘT) */}
          <div className="lg:col-span-8">
            {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
            {activeTab === "info" && (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
              {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Thông tin cơ bản</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email đăng ký
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    {/*<p className="text-[11px] text-slate-400 mt-1">Email được bảo mật bằng mã OTP xác thực.</p>*/}
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Link ảnh Avatar */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Đường dẫn hình ảnh đại diện (URL)
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* KHỐI 2: ĐỔI MẬT KHẨU (TÙY CHỌN) */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Bảo mật & Đổi mật khẩu</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mật khẩu hiện tại */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút Submit Lưu thay đổi */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  {/*<Sparkles className="w-3.5 h-3.5 text-blue-600" /> Dữ liệu được mã hóa an toàn*/}
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            )}

            {/* TAB 2: SỔ ĐỊA CHỈ NGƯỜI DÙNG */}
            {activeTab === "address" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Sổ địa chỉ nhận dịch vụ</h3>
                    <p className="text-xs text-slate-500">Quản lý nhiều địa chỉ và chỉ định 1 địa chỉ mặc định để đặt lịch nhanh chóng</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 transition self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm địa chỉ</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
                  <span>Đang tải sổ địa chỉ...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl my-4">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Chưa có địa chỉ nào trong sổ địa chỉ</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thêm địa chỉ nhà, văn phòng để đặt dịch vụ tiện lợi hơn</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="mt-3 px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200 cursor-pointer transition"
                  >
                    + Thêm địa chỉ đầu tiên
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition relative flex flex-col justify-between gap-3 ${
                        addr.isDefault
                          ? "border-purple-300 bg-purple-50/20 shadow-xs ring-1 ring-purple-400/20"
                          : "border-slate-200 bg-slate-50/60 hover:bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-sm text-slate-900">{addr.receiverName}</span>
                          {addr.isDefault ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              <Check className="w-3 h-3 text-purple-600" /> Mặc định
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] text-slate-500 hover:text-purple-600 underline font-medium cursor-pointer"
                            >
                              Chọn làm mặc định
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 font-mono mb-2">
                          Số điện thoại: <strong className="text-slate-700 font-semibold">{addr.phone}</strong>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed font-medium">
                          {addr.detailAddress}
                          {[addr.ward, addr.district, addr.province].filter(Boolean).length > 0 && (
                            <span className="text-slate-500">
                              {", "}
                              {[addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút hành động Sửa / Xóa */}
                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition"
                        >
                          <Edit className="w-3 h-3" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* TAB 3: LỊCH SỬ ĐƠN HÀNG */}
            {activeTab === "orders" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Lịch sử đơn dịch vụ</h3>
                    <p className="text-xs text-slate-500">Theo dõi tiến độ, thanh toán và đánh giá các dịch vụ bạn đã đặt</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {bookings.length} đơn hàng
                </span>
              </div>

              {loadingBookings ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <span>Đang tải lịch sử đơn hàng...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-14 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl my-6">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">Chưa có lịch sử đặt dịch vụ</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Khám phá các dịch vụ vệ sinh, sửa chữa, giặt ủi uy tín ngay trên CleanMate
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    <span>Khám phá dịch vụ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded-md">
                            {b.bookingCode}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(b.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              b.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : b.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : b.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {b.status === "PENDING" && "Chờ xác nhận"}
                            {b.status === "CONFIRMED" && "Đã xác nhận"}
                            {b.status === "IN_PROGRESS" && "Đang thực hiện"}
                            {b.status === "COMPLETED" && "Hoàn thành"}
                            {b.status === "CANCELLED" && "Đã hủy"}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              b.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {b.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                            {b.serviceImage ? (
                              <img
                                src={b.serviceImage}
                                alt={b.serviceTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/dichvu/${b.serviceId}`}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 transition flex items-center gap-1 group line-clamp-1"
                            >
                              <span>{b.serviceTitle}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Gian hàng: <strong className="text-slate-700 font-semibold">{b.shopName}</strong>
                            </p>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">{b.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                          <div className="text-xs text-slate-500">Tổng thanh toán</div>
                          <div className="text-base font-extrabold text-blue-600">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(b.totalPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{b.paymentMethod}</div>
                        </div>
                      </div>

                      {/* Thông tin đánh giá nếu có */}
                      {b.hasReviewed && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                          <div className="flex items-center gap-0.5 shrink-0 pt-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  (b.rating || 0) >= s ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="grow">
                            <span className="font-bold text-amber-800">Đánh giá của bạn: </span>
                            <span className="italic">"{b.reviewComment || "Rất hài lòng với chất lượng dịch vụ"}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* TAB 4: HỖ TRỢ KHÁCH HÀNG */}
            {activeTab === "support" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Trung tâm Hỗ trợ & CSKH</h3>
                  <p className="text-xs text-slate-500">Liên hệ trực tiếp đội ngũ CleanMate để được tư vấn và giải đáp thắc mắc 24/7</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Tổng đài Hotline</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Hỗ trợ khẩn cấp, đặt lịch và khiếu nại</p>
                    <a
                      href="tel:19006868"
                      className="inline-block mt-2 text-base font-extrabold text-blue-600 hover:text-blue-700"
                    >
                      1900 6868
                    </a>
                    <span className="block text-[11px] text-slate-400 mt-0.5">(8:00 - 21:00 hàng ngày)</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/30">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Email Hỗ trợ</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Gửi ý kiến đóng góp hoặc phản hồi dịch vụ</p>
                    <a
                      href="mailto:support@cleanmate.vn"
                      className="inline-block mt-2 text-sm font-bold text-purple-600 hover:text-purple-700"
                    >
                      support@cleanmate.vn
                    </a>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Phản hồi trong vòng 24 giờ</span>
                  </div>
                </div>
              </div>

              {/* Câu hỏi thường gặp FAQ */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Câu hỏi thường gặp
                </h4>

                <div className="space-y-2">
                  <details className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <summary className="font-semibold text-xs text-slate-800 list-none flex items-center justify-between">
                      <span>Làm sao để thay đổi hoặc hủy lịch hẹn dịch vụ?</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-200/60 leading-relaxed">
                      Bạn có thể vào tab <strong>Lịch sử đơn hàng</strong> để kiểm tra trạng thái đơn. Nếu đơn đang ở trạng thái <em>Chờ xác nhận</em>, bạn có thể liên hệ trực tiếp tổng đài hotline 1900 6868 hoặc nhắn tin với đối tác cung ứng để đổi giờ hoặc hủy lịch hẹn miễn phí.
                    </p>
                  </details>

                  <details className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <summary className="font-semibold text-xs text-slate-800 list-none flex items-center justify-between">
                      <span>Chính sách bảo hành và cam kết chất lượng ra sao?</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-200/60 leading-relaxed">
                      CleanMate cam kết bảo hành các dịch vụ vệ sinh và kỹ thuật trong vòng 48h sau khi hoàn thành. Nếu có bất kỳ điểm nào chưa hài lòng, nhân viên đối tác sẽ đến kiểm tra và khắc phục hoàn toàn miễn phí.
                    </p>
                  </details>

                  <details className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <summary className="font-semibold text-xs text-slate-800 list-none flex items-center justify-between">
                      <span>Các hình thức thanh toán được hỗ trợ?</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-200/60 leading-relaxed">
                      Hệ thống hỗ trợ thanh toán linh hoạt bằng Tiền mặt khi hoàn thành dịch vụ (COD), chuyển khoản ngân hàng hoặc ví điện tử (VNPAY, Momo).
                    </p>
                  </details>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL THÊM / SỬA ĐỊA CHỈ */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span>{editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addressModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addressModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tên người nhận */}
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Ví dụ: Anh Nam"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Địa chỉ chi tiết (Số nhà, đường, toà nhà, căn hộ) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Ví dụ: Căn 1205, Toà S2.01 Vinhomes Smart City, Tây Mỗ"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              {/* Phường/Xã, Quận/Huyện, Tỉnh/Thành phố */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phường / Xã
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Tây Mỗ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Nam Từ Liêm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tỉnh / TP
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Hà Nội"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Checkbox Đặt làm mặc định */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefaultAddress}
                  onChange={(e) => setIsDefaultAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="isDefaultCheckbox" className="font-semibold text-slate-800 cursor-pointer select-none">
                  Đặt làm địa chỉ nhận dịch vụ mặc định
                </label>
              </div>

              {/* Nút hành động Modal */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  disabled={isSavingAddress}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingAddress ? "Lưu thay đổi" : "Thêm địa chỉ"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
