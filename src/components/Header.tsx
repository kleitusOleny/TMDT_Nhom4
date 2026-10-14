"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, User as UserIcon, LogOut, Shield, ChevronDown } from "lucide-react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CurrentUser {
  id: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

interface HeaderProps {
  currentPath?: string;
  showSearchOrBooking?: boolean;
}

export default function Header({ currentPath = "/", showSearchOrBooking = true }: HeaderProps) {
  const router = useRouter();
  const { data: sessionData, status: sessionStatus } = useSession();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // Kiểm tra cookie session qua API /api/auth/me
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setCurrentUser(data.user);
            setIsLoadingAuth(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not check local session:", err);
      }

      // Fallback kiểm tra NextAuth session (ví dụ Google OAuth)
      if (sessionStatus === "authenticated" && sessionData?.user && isMounted) {
        setCurrentUser({
          id: Number(sessionData.user.id) || 0,
          fullName: sessionData.user.name || "Khách hàng",
          email: sessionData.user.email || null,
          phone: null,
          role: "CUSTOMER",
          image: sessionData.user.image,
        });
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [sessionStatus, sessionData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (sessionData) {
        await nextAuthSignOut({ redirect: false });
      }
      setCurrentUser(null);
      setIsDropdownOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName = currentUser?.fullName || currentUser?.phone || currentUser?.email || "Tài khoản";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Clean<span className="text-blue-600">Mate</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className={
              currentPath === "/"
                ? "text-blue-600 font-semibold hover:text-blue-700 transition"
                : "hover:text-blue-600 transition"
            }
          >
            Trang chủ
          </Link>
          <Link
            href="/dichvu"
            className={
              currentPath.startsWith("/dichvu")
                ? "text-blue-600 font-semibold hover:text-blue-700 transition"
                : "hover:text-blue-600 transition"
            }
          >
            Dịch vụ
          </Link>
          <Link href="/#providers" className="hover:text-blue-600 transition">
            Đối tác
          </Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 transition">
            Quy trình
          </Link>
          <Link href="/#guarantee" className="hover:text-blue-600 transition">
            Về chúng tôi
          </Link>
        </nav>

        {/* Action / Auth Buttons */}
        <div className="flex items-center gap-3">
          {isLoadingAuth ? (
            <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" />
          ) : currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Nút chuyển hướng nhanh đến Trang Quản trị (Admin) trên Header */}
              {currentUser.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Trang Quản Trị</span>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="max-w-[140px] truncate">{displayName}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Đăng nhập với</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                    {currentUser.role === "ADMIN" && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded">
                        Quản trị viên
                      </span>
                    )}
                  </div>

                  {currentUser.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      <Shield className="w-4 h-4 text-blue-600" />
                      Trang Quản trị (Admin)
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition"
              >
                Đăng ký
              </Link>
            </>
          )}

          {showSearchOrBooking && (
            <Link
              href="/#booking-box"
              className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition items-center gap-1.5 cursor-pointer"
            >
              Đặt dịch vụ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
