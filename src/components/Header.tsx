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
  SlidersHorizontal,
  Star,
  Store,
  ShoppingCart,
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

const PRICE_CRITERIA = [
  { label: "Tất cả mức giá", min: undefined, max: undefined },
  { label: "Dưới 200.000đ", min: undefined, max: 200000 },
  { label: "200.000đ - 500.000đ", min: 200000, max: 500000 },
  { label: "Trên 500.000đ", min: 500000, max: undefined },
];

const AREA_CRITERIA = ["Toàn TP.HCM", "Quận 1", "Quận 7", "Bình Thạnh", "TP. Thủ Đức"];

const POPULAR_SEARCH_TAGS = [
  "Dọn nhà theo giờ",
  "Giặt ghế sofa",
  "Vệ sinh máy lạnh Inverter",
  "Lau kính văn phòng",
  "Khử khuẩn nhà xưởng",
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

  // Hover mega dropdown
  const [isServicesHovered, setIsServicesHovered] = useState(false);
  const servicesDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Search Modal Popup
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriceIndex, setSelectedPriceIndex] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<string>("Toàn TP.HCM");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mở popup và auto-focus input
  const openSearchModal = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const closeSearchModal = () => {
    setIsSearchOpen(false);
  };

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

  const executeSearch = (overrideKeyword?: string) => {
    const kw = overrideKeyword !== undefined ? overrideKeyword : searchKeyword;
    const params = new URLSearchParams();
    if (kw.trim()) {
      params.set("search", kw.trim());
    }
    if (selectedCategory && selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    const priceChoice = PRICE_CRITERIA[selectedPriceIndex];
    if (priceChoice.min !== undefined) {
      params.set("minPrice", String(priceChoice.min));
    }
    if (priceChoice.max !== undefined) {
      params.set("maxPrice", String(priceChoice.max));
    }
    if (selectedRating > 0) {
      params.set("rating", String(selectedRating));
    }
    closeSearchModal();
    const queryStr = params.toString();
    router.push(`/dichvu${queryStr ? `?${queryStr}` : ""}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  // Lắng nghe phím tắt ESC hoặc Cmd+K / Ctrl+K để mở tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
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
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* CỘT TRÁI: LOGO & NAV LINKS */}
          <div className="flex items-center gap-7 lg:gap-9">
            {/* Logo CleanMate (Nguyên bản xanh dương) */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                Clean<span className="text-blue-600">Mate</span>
              </span>
            </Link>

            {/* Navigation links với chevron phong cách tương tự Cloudflare */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              {/* Menu Dịch Vụ Hover Mega Dropdown */}
              <div
                className="relative py-3"
                onMouseEnter={handleMouseEnterServices}
                onMouseLeave={handleMouseLeaveServices}
              >
                <button
                  type="button"
                  onClick={() => router.push("/dichvu")}
                  className={`inline-flex items-center gap-1 transition cursor-pointer ${
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
                </button>

                {/* Mega Menu Dropdown */}
                {isServicesHovered && (
                  <div className="absolute top-full left-0 mt-0.5 w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Phân loại dịch vụ
                      </span>
                      <Link
                        href="/dichvu"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Tất cả <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="py-2 space-y-1">
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

                    <div className="pt-2 border-t border-slate-100 px-3 py-1 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hơn 50+ gói làm sạch theo tiêu chuẩn</span>
                      </div>
                      <Link
                        href="/dichvu"
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Khám phá ngay
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/#providers"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
              >
                <span>Đối tác</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
              >
                <span>Quy trình</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/#guarantee"
                className="text-slate-600 hover:text-blue-600 transition"
              >
                Về chúng tôi
              </Link>
            </nav>
          </div>

          {/* CỘT PHẢI: LOGIN / ADMIN / ĐẶT LỊCH / ICON KÍNH LÚP TÌM KIẾM */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Auth Actions */}
            {isLoadingAuth ? (
              <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Trang Quản Trị</span>
                  </Link>
                )}

                {currentUser.role === "PROVIDER" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Kênh Người Bán</span>
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

                  {/* User dropdown */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-900"
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Đăng nhập với</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                        {currentUser.role === "ADMIN" && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded">
                            Quản trị viên
                          </span>
                        )}
                        {currentUser.role === "PROVIDER" && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded">
                            Nhà cung cấp
                          </span>
                        )}
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        Thông tin cá nhân
                      </Link>

                      {currentUser.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Trang Quản trị (Admin)
                        </Link>
                      )}

                      {currentUser.role === "PROVIDER" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                        >
                          <Store className="w-4 h-4 text-blue-600" />
                          Kênh Quản trị Người bán
                        </Link>
                      )}
                      {currentUser.role === "CLEANER" && (
                        <Link
                          href="/profile?tab=tasks"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-teal-700 bg-teal-50/50 hover:bg-teal-50 hover:text-teal-800 font-semibold transition"
                        >
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          Công việc Cleaner
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Nút Đặt dịch vụ màu xanh thương hiệu CleanMate */}
            {showSearchOrBooking && (
              <Link
                href="/#booking-box"
                className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition items-center gap-1.5 cursor-pointer"
              >
                Đặt dịch vụ
              </Link>
            )}

            {/* Icon Giỏ hàng (Cart) */}
            <Link
              href="/cart"
              title="Xem giỏ hàng dịch vụ"
              className="relative w-10 h-10 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
            </Link>

            {/* Icon Tìm kiếm kính lúp tinh gọn kiểu Cloudflare */}
            <button
              type="button"
              onClick={openSearchModal}
              title="Tìm kiếm dịch vụ (Ctrl + K)"
              className="w-10 h-10 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MODAL TÌM KIẾM CÙNG CÁC TIÊU CHÍ (POPUP SEARCH MODAL SÁNG MÀU GIAO DIỆN CŨ) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header thanh input search */}
            <form onSubmit={handleSearchSubmit} className="relative border-b border-slate-100 p-4 sm:p-5 flex items-center gap-3 bg-slate-50/50">
              <Search className="w-5 h-5 text-blue-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm tên dịch vụ, đơn vị cung cấp hoặc nhu cầu làm sạch..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword("")}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearchModal}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs transition"
              >
                ESC
              </button>
            </form>

            {/* BỘ LỌC CÁC TIÊU CHÍ TÌM KIẾM */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Tiêu chí 1: Danh mục dịch vụ */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  Danh mục dịch vụ
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả danh mục
                  </button>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        selectedCategory === cat.slug
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí 2: Mức giá mong muốn */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Khoảng giá dịch vụ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRICE_CRITERIA.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPriceIndex(idx)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition cursor-pointer border ${
                        selectedPriceIndex === idx
                          ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí 3: Đánh giá sao & Khu vực */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Đánh giá sao */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Đánh giá chất lượng
                  </label>
                  <div className="flex gap-2">
                    {[0, 4, 4.5, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer border ${
                          selectedRating === star
                            ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {star === 0 ? (
                          "Tất cả"
                        ) : (
                          <>
                            <span>{star}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Khu vực */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Khu vực phục vụ
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                  >
                    {AREA_CRITERIA.map((area) => (
                      <option key={area} value={area} className="bg-white text-slate-800">
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gợi ý tìm kiếm phổ biến */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tìm kiếm phổ biến
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchKeyword(tag);
                        executeSearch(tag);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3 h-3 text-slate-400" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal với nút kích hoạt */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">Enter</kbd> để tìm kiếm theo tiêu chí
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={closeSearchModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Áp dụng tìm kiếm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

