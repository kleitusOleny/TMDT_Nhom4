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
} from "lucide-react";

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
  }, [router]);

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
    CUSTOMER: { label: "Khách hàng thân thiết", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
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
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
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
          {/* CỘT TRÁI: THẺ TỔNG QUAN TÀI KHOẢN (4 CỘT) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center">
              {/* Avatar hình tròn */}
              <div className="relative inline-block mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-blue-500/30 overflow-hidden border-4 border-white">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : profile?.fullName ? (
                    profile.fullName[0].toUpperCase()
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 truncate">
                {profile?.fullName || "Người dùng CleanMate"}
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.email || "Chưa thiết lập email"}</p>

              {/* Huy hiệu vai trò */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${currentRoleInfo.bg} ${currentRoleInfo.text}`}>
                  {currentRoleInfo.label}
                </span>
              </div>

              {/* Thông tin metadata */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mã tài khoản (ID):</span>
                  <span className="font-mono font-bold text-slate-800">#{profile?.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hoạt động
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ngày tham gia:</span>
                  <span className="font-medium text-slate-700">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Khối gian hàng đối tác nếu có */}
            {profile?.shops && profile.shops.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Gian hàng phụ trách</h3>
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

          {/* CỘT PHẢI: FORM CHỈNH SỬA HỒ SƠ & BẢO MẬT (8 CỘT) */}
          <div className="lg:col-span-8">
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
                    <p className="text-[11px] text-slate-400 mt-1">Email được bảo mật bằng mã OTP xác thực.</p>
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
                <p className="text-xs text-slate-400 mt-1.5 mb-4">
                  Để trống nếu bạn không có nhu cầu thay đổi mật khẩu đăng nhập hiện tại.
                </p>

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
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Dữ liệu được mã hóa an toàn
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
