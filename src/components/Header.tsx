"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  User as UserIcon,
  LogOut,
  Shield,
  ChevronDown,
  Search,
  Home,
  Building2,
  Factory,
  Armchair,
  Wind,
  Layers,
  ArrowRight,
  X,
} from "lucide-react";
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

interface CategoryNav {
  name: string;
  slug: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

const SERVICE_CATEGORIES: CategoryNav[] = [
  {
    name: "Vệ sinh nhà ở",
    slug: "ve-sinh-nha-o",
    description: "Dọn dẹp phòng khách, bếp, phòng ngủ toàn diện",
    icon: Home,
  },
  {
    name: "Vệ sinh văn phòng",
    slug: "ve-sinh-van-phong",
    description: "Làm sạch sàn, bàn ghế, thiết bị định kỳ",
    icon: Building2,
  },
  {
    name: "Vệ sinh công nghiệp",
    slug: "ve-sinh-cong-nghiep",
    description: "Nhà xưởng, kho bãi, vệ sinh sau xây dựng",
    icon: Factory,
  },
  {
    name: "Giặt sofa & nệm",
    slug: "giat-sofa-nem",
    description: "Phun hút diệt khuẩn 99.9%, khử mùi hôi nấm mốc",
    icon: Armchair,
    badge: "Phổ biến",
  },
  {
    name: "Vệ sinh máy lạnh",
    slug: "ve-sinh-may-lanh",
    description: "Bảo dưỡng, nạp gas, xịt rửa dàn lạnh chuyên sâu",
    icon: Wind,
  },
];

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

  // State cho thanh tìm kiếm trên header
  const [searchQuery, setSearchQuery] = useState("");
  const [isServicesHovered, setIsServicesHovered] = useState(false);
  const servicesDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterServices = () => {
    if (servicesDropdownTimer.current) {
      clearTimeout(servicesDropdownTimer.current);
    }
    setIsServicesHovered(true);
  };

  const handleMouseLeaveServices = () => {
    servicesDropdownTimer.current = setTimeout(() => {
      setIsServicesHovered(false);
    }, 150);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      router.push("/dichvu");
      return;
    }
    router.push(`/dichvu?search=${encodeURIComponent(searchQuery.trim())}`);
  };

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
          role: sessionData.user.role || "CUSTOMER",
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
      if (servicesDropdownTimer.current) {
        clearTimeout(servicesDropdownTimer.current);
      }
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Clean<span className="text-blue-600">Mate</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
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

            {/* Menu Dịch Vụ Có Hover Dropdown */}
            <div
              className="relative py-2"
              onMouseEnter={handleMouseEnterServices}
              onMouseLeave={handleMouseLeaveServices}
            >
              <Link
                href="/dichvu"
                className={`inline-flex items-center gap-1 transition ${
                  currentPath.startsWith("/dichvu")
                    ? "text-blue-600 font-semibold hover:text-blue-700"
                    : "hover:text-blue-600"
                }`}
              >
                <span>Dịch vụ</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isServicesHovered ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                />
              </Link>

              {/* Mega Dropdown Menu khi hover */}
              {isServicesHovered && (
                <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Danh mục dịch vụ
                    </span>
                    <Link
                      href="/dichvu"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Xem tất cả <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="py-1.5 space-y-1">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={cat.slug}
                          href={`/dichvu?category=${cat.slug}`}
                          onClick={() => setIsServicesHovered(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition">
                                {cat.name}
                              </span>
                              {cat.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {cat.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-1 pt-2 border-t border-slate-100 px-3 py-1 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hơn 50+ gói làm sạch theo yêu cầu</span>
                    </div>
                    <Link
                      href="/dichvu"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Khám phá ngay
                    </Link>
                  </div>
                </div>
              )}
            </div>

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
        </div>

        {/* Thanh tìm kiếm trên Header */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dịch vụ (dọn nhà, sofa, máy lạnh...)"
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Action / Auth Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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
