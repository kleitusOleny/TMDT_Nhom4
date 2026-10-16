"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  RotateCcw,
  Clock,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0); // 60s đếm ngược nút gửi lại
  const [otpExpiresCountdown, setOtpExpiresCountdown] = useState(0); // 300s (5 phút) đếm ngược vô hiệu hoá mã OTP

  // Trạng thái đã xác minh OTP thành công hay chưa
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown timer cho nút gửi lại OTP (60s)
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Countdown timer cho hiệu lực của mã OTP (5 phút = 300 giây)
  useEffect(() => {
    if (otpExpiresCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpExpiresCountdown((prev) => {
        if (prev <= 1) {
          // Khi hết 5 phút mà chưa xác minh xong thì thông báo OTP hết hạn
          if (!isOtpVerified) {
            setErrorMessage("Mã OTP đã hết hiệu lực sau 5 phút. Vui lòng bấm 'Gửi lại' để nhận mã mới.");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpExpiresCountdown, isOtpVerified]);

  // Gửi OTP lấy lại mật khẩu
  const handleSendOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Vui lòng nhập Email để nhận mã đặt lại mật khẩu.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Email không đúng định dạng (Ví dụ: name@example.com).");
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          type: "FORGOT_PASSWORD",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi mã xác nhận.");
      }

      setIsOtpSent(true);
      setOtpCountdown(60);
      setOtpExpiresCountdown(300); // 5 phút đếm ngược
      setSuccessMessage(data?.message || "Mã OTP 6 số đã được gửi tới Gmail của bạn.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi gửi mã đặt lại mật khẩu.";
      setErrorMessage(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Định dạng thời gian mm:ss cho 5 phút hết hạn
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Xác thực mã OTP trước khi mở khung đặt mật khẩu mới
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      setErrorMessage("Vui lòng nhập địa chỉ Email.");
      return;
    }

    if (!isOtpSent) {
      setErrorMessage("Vui lòng nhấn 'Gửi OTP' để nhận mã xác thực qua email trước.");
      return;
    }

    if (otpExpiresCountdown <= 0) {
      setErrorMessage("Mã OTP đã hết hiệu lực (quá 5 phút). Vui lòng nhấn 'Gửi lại' để nhận mã mới.");
      return;
    }

    if (!cleanOtp) {
      setErrorMessage("Vui lòng nhập mã xác thực OTP 6 số.");
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setErrorMessage("Mã xác thực OTP phải gồm 6 chữ số.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Mã OTP không hợp lệ.");
      }

      setIsOtpVerified(true);
      setSuccessMessage("Xác thực OTP thành công! Vui lòng thiết lập mật khẩu mới bên dưới.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Mã OTP không hợp lệ hoặc đã hết hạn.";
      setErrorMessage(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Đặt lại mật khẩu mới khi đã xác thực OTP
  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!newPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Không thể đặt lại mật khẩu.");
      }

      setSuccessMessage(data?.message || "Mật khẩu đã được cập nhật thành công! Đang chuyển đến trang đăng nhập...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi, vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans">
      {/* CỘT TRÁI: FORM QUÊN MẬT KHẨU */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Header Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Clean<span className="text-blue-600">Mate</span>
            </span>
          </Link>
        </div>

        {/* Khối chính Form */}
        <div className="w-full max-w-md mx-auto my-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quên mật khẩu?
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {!isOtpVerified
                ? "Nhập email tài khoản để nhận mã OTP xác thực trước khi tạo mật khẩu mới."
                : "Mã OTP đã được xác thực! Vui lòng nhập mật khẩu mới cho tài khoản của bạn."}
            </p>
          </div>

          {/* Stepper chỉ dẫn bước */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isOtpVerified
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isOtpVerified ? "✓" : "1"}
              </span>
              <span className={isOtpVerified ? "text-emerald-700" : "text-blue-700 font-bold"}>
                Xác thực OTP
              </span>
            </div>
            <div className={`h-0.5 flex-1 ${isOtpVerified ? "bg-emerald-500" : "bg-slate-200"}`} />
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isOtpVerified
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                2
              </span>
              <span className={isOtpVerified ? "text-blue-700 font-bold" : "text-slate-400"}>
                Đổi mật khẩu
              </span>
            </div>
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isOtpVerified ? (
            /* BƯỚC 1: NHẬP EMAIL & XÁC THỰC MÃ OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Input Email & Nút gửi OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      disabled={isSendingOtp || isVerifyingOtp}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || otpCountdown > 0 || !email.trim() || isVerifyingOtp}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {otpCountdown > 0 ? `${otpCountdown}s` : isOtpSent ? "Gửi lại" : "Gửi OTP"}
                  </button>
                </div>
              </div>

              {/* Input OTP */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Mã xác thực OTP (6 chữ số) <span className="text-rose-500">*</span>
                  </label>
                  {!isOtpSent ? (
                    <span className="text-[11px] text-amber-600 font-medium">
                      Nhấn &quot;Gửi OTP&quot; để nhận mã qua email
                    </span>
                  ) : otpExpiresCountdown > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      <Clock className="w-3 h-3 text-blue-600" />
                      Hiệu lực còn: {formatTime(otpExpiresCountdown)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Mã đã hết hạn (quá 5 phút)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ví dụ: 123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition disabled:bg-slate-100 disabled:opacity-60"
                    disabled={!isOtpSent || isVerifyingOtp}
                  />
                </div>
              </div>

              {/* Nút kiểm tra mã OTP */}
              <button
                type="submit"
                disabled={isVerifyingOtp || !isOtpSent || otp.trim().length !== 6 || otpExpiresCountdown <= 0}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang kiểm tra mã OTP...
                  </>
                ) : (
                  <>
                    Xác nhận mã OTP & Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* BƯỚC 2: CHỈ HIỆN KHI ĐÃ NHẬP VÀ XÁC THỰC OTP THÀNH CÔNG */
            <form onSubmit={handleSubmitNewPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Email xác thực: <strong>{email.trim().toLowerCase()}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpVerified(false);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  className="text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer text-[11px]"
                >
                  Đổi email khác
                </button>
              </div>

              {/* Input Mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu mật khẩu mới...
                  </>
                ) : (
                  <>
                    Xác nhận lưu mật khẩu mới
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quay lại đăng nhập */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Nhớ lại mật khẩu?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Quay về Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Footer ghi chú nhỏ */}
        <div className="text-xs text-slate-400 text-center lg:text-left">
          © 2026 CleanMate Corporation. Bảo mật thông tin an toàn theo tiêu chuẩn SSL.
        </div>
      </div>

      {/* CỘT PHẢI: BANNER THƯƠNG HIỆU */}
      <div className="hidden lg:col-span-6 xl:col-span-7 lg:relative lg:flex flex-col justify-between p-12 bg-slate-900 text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80"
          alt="CleanMate background"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-blue-950/70" />

        <div className="relative z-10 flex justify-end">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hệ thống bảo mật đa tầng
          </span>
        </div>

        <div className="relative z-10 max-w-xl mx-auto my-auto text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug mb-6 text-white">
            Bảo vệ tài khoản và <br />
            <span className="text-blue-400">quyền riêng tư tuyệt đối</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
            Hệ thống xác thực mã OTP thời gian thực qua hòm thư Gmail giúp đảm bảo chỉ chính bạn mới có thể thay đổi và quản lý mật khẩu của mình.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>Dịch vụ hỗ trợ trực tuyến 24/7</span>
          {/*<span className="text-slate-500">cleanmate.vn</span>*/}
        </div>
      </div>
    </div>
  );
}
