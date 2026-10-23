"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  BarChart3,
  Users,
  Building2,
  Layers,
  CalendarCheck,
  DollarSign,
  ShieldCheck,
  Store,
  Home,
  Menu,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquareStar,
} from "lucide-react";

interface CurrentUser {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "PROVIDER" | "STAFF" | "CUSTOMER";
  shops?: { id: number; name: string; slug: string; approvalStatus: string }[];
}

interface AdminContextType {
  viewMode: "ADMIN" | "SELLER";
  setViewMode: (mode: "ADMIN" | "SELLER") => void;
  selectedSellerId: number;
  setSelectedSellerId: (id: number) => void;
  shopsList: { id: number; name: string }[];
  showToast: (msg: string) => void;
  currentUser: CurrentUser | null;
  isProviderOnly: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminLayout");
  }
  return context;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [viewMode, setViewMode] = useState<"ADMIN" | "SELLER">("ADMIN");
  const [selectedSellerId, setSelectedSellerId] = useState<number>(1);
  const [shopsList, setShopsList] = useState<{ id: number; name: string }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isProviderOnly = currentUser?.role === "PROVIDER";

  // Xác thực quyền truy cập: Hỗ trợ cả ADMIN và PROVIDER
  useEffect(() => {
    let isCancelled = false;
    async function verifyRole() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const user = data.user as CurrentUser | undefined;

        if (!res.ok || !data.authenticated || !user || (user.role !== "ADMIN" && user.role !== "PROVIDER")) {
          if (!isCancelled) {
            setIsAuthorized(false);
            setIsCheckingAuth(false);
            router.replace("/login");
          }
          return;
        }

        if (!isCancelled) {
          setCurrentUser(user);
          setIsAuthorized(true);

          if (user.role === "PROVIDER") {
            // Nếu là PROVIDER: Ép chế độ Người Bán (SELLER) và giới hạn cửa hàng chỉ thuộc về họ
            setViewMode("SELLER");
            const userShops = user.shops || [];
            if (userShops.length > 0) {
              setShopsList(userShops.map((s) => ({ id: s.id, name: s.name })));
              setSelectedSellerId(userShops[0].id);
            } else {
              setShopsList([]);
            }
          } else {
            // Nếu là ADMIN: Tải danh sách tất cả các shop đã duyệt
            try {
              const resShops = await fetch("/api/admin/providers?status=APPROVED");
              const jsonShops = await resShops.json();
              if (jsonShops.success && jsonShops.shops && jsonShops.shops.length > 0) {
                setShopsList(jsonShops.shops.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
                setSelectedSellerId(jsonShops.shops[0].id);
              }
            } catch (err) {
              console.error("Lỗi tải danh sách shops cho Admin:", err);
            }
          }

          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error("Lỗi xác thực người dùng:", err);
        if (!isCancelled) {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          router.replace("/login");
        }
      }
    }

    verifyRole();
    return () => {
      isCancelled = true;
    };
  }, [router]);

  // Bảo vệ route nếu PROVIDER cố tình truy cập vào các trang chỉ dành riêng cho ADMIN (/admin/users, /admin/providers)
  useEffect(() => {
    if (isProviderOnly) {
      if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/providers")) {
        router.replace("/admin");
      }
    }
  }, [isProviderOnly, pathname, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <h2 className="text-base font-semibold text-slate-700">Đang kiểm tra quyền truy cập...</h2>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Truy Cập Bị Từ Chối</h1>
        <p className="text-slate-600 text-sm max-w-md mb-6">
          Khu vực quản trị chỉ dành cho tài khoản Quản trị viên (ADMIN) hoặc Nhà cung cấp dịch vụ (PROVIDER).
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition"
        >
          Đăng nhập tài khoản khác
        </Link>
      </div>
    );
  }

  // Tiêu đề tương ứng với route đang truy cập
  const getPageTitle = () => {
    if (pathname === "/admin" || pathname === "/admin/analytics") {
      return isProviderOnly ? "Báo cáo Doanh thu Cửa hàng" : "Báo cáo Thống kê & Doanh thu";
    }
    if (pathname.startsWith("/admin/users")) return "Phân quyền Tài khoản & Người dùng (RBAC)";
    if (pathname.startsWith("/admin/providers")) return "Quản lý Nhà cung cấp & Đối tác dịch vụ";
    if (pathname.startsWith("/admin/services")) {
      return viewMode === "ADMIN" ? "Quản trị Danh mục Dịch vụ" : "Dịch vụ của Shop";
    }
    if (pathname.startsWith("/admin/bookings")) {
      return viewMode === "ADMIN" ? "Quản lý Lịch hẹn & Đơn đặt dịch vụ" : "Đơn hàng nhận việc";
    }
    if (pathname.startsWith("/admin/finance")) {
      return viewMode === "ADMIN" ? "Báo cáo Tài chính & Hoa hồng 15%" : "Ví doanh thu & Rút tiền";
    }
    if (pathname.startsWith("/admin/reviews")) {
      return viewMode === "ADMIN" ? "Quản lý Bình luận & Đánh giá khách hàng" : "Phản hồi & Cảm xúc khách hàng";
    }
    return isProviderOnly ? "Kênh Quản Trị Gian Hàng Đối Tác" : "Quản Trị Hệ Thống CleanMate";
  };

  const navItems = [
    {
      label: isProviderOnly ? "Thống kê & Doanh thu" : "Thống kê & Biểu đồ",
      href: "/admin",
      icon: BarChart3,
      adminOnly: false,
      isActive: pathname === "/admin" || pathname === "/admin/analytics",
    },
    {
      label: "Phân quyền",
      href: "/admin/users",
      icon: Users,
      adminOnly: true,
      isActive: pathname.startsWith("/admin/users"),
    },
    {
      label: "Quản lý Nhà cung cấp",
      href: "/admin/providers",
      icon: Building2,
      adminOnly: true,
      isActive: pathname.startsWith("/admin/providers"),
    },
    {
      label: isProviderOnly || viewMode === "SELLER" ? "Dịch vụ của tôi" : "Quản lý Dịch vụ",
      href: "/admin/services",
      icon: Layers,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/services"),
    },
    {
      label: isProviderOnly || viewMode === "SELLER" ? "Đơn hàng nhận việc" : "Quản lý Đơn hàng",
      href: "/admin/bookings",
      icon: CalendarCheck,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/bookings"),
    },
    {
      label: isProviderOnly || viewMode === "SELLER" ? "Ví & Rút tiền" : "Tài chính & Hoa hồng",
      href: "/admin/finance",
      icon: DollarSign,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/finance"),
    },
    {
      label: isProviderOnly || viewMode === "SELLER" ? "Bình luận & Đánh giá" : "Quản lý Đánh giá",
      href: "/admin/reviews",
      icon: MessageSquareStar,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/reviews"),
    },
  ];

  return (
    <AdminContext.Provider
      value={{
        viewMode: isProviderOnly ? "SELLER" : viewMode,
        setViewMode: isProviderOnly ? () => {} : setViewMode,
        selectedSellerId,
        setSelectedSellerId,
        shopsList,
        showToast,
        currentUser,
        isProviderOnly,
      }}
    >
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
        {/* TOAST THÔNG BÁO */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm animate-bounce border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* BACKDROP FOR MOBILE SIDEBAR */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          />
        )}

        {/* SIDEBAR NAVIGATION CỐ ĐỊNH BÊN TRÁI */}
        <aside
          className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo CleanMate */}
            <div className="h-18 px-6 border-b border-slate-100 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Clean<span className="text-blue-600">Mate</span>
                </span>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 md:hidden rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chuyển đổi Không gian Admin <-> Kênh Người Bán */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>Không gian quản lý</span>
                {isProviderOnly && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Đối tác
                  </span>
                )}
              </div>

              {/* Nếu là PROVIDER thì ẨN TAB ADMIN, chỉ hiện badge Kênh Người Bán */}
              {isProviderOnly ? (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2.5 text-blue-700 font-semibold text-xs">
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Nhà cung cấp</div>
                    <div className="truncate text-xs font-bold text-blue-900">
                      {currentUser?.fullName || "Gian hàng đối tác"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
                  <button
                    onClick={() => {
                      startTransition(() => setViewMode("ADMIN"));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "ADMIN"
                        ? "bg-white text-blue-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                  <button
                    onClick={() => {
                      startTransition(() => setViewMode("SELLER"));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "SELLER"
                        ? "bg-white text-blue-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Người Bán</span>
                  </button>
                </div>
              )}

              {/* Dropdown chọn Cửa hàng:
                  - Nếu là PROVIDER có nhiều hơn 1 cửa hàng: cho chọn giữa các cửa hàng của họ
                  - Nếu là ADMIN ở chế độ SELLER: cho chọn trong toàn bộ danh sách shop
              */}
              {(viewMode === "SELLER" || isProviderOnly) && shopsList.length > 0 && (
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 px-1">
                    {isProviderOnly ? "Cửa hàng của bạn:" : "Chọn gian hàng:"}
                  </label>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(Number(e.target.value))}
                    disabled={isProviderOnly && shopsList.length <= 1}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-2.5 rounded-xl shadow-2xs text-slate-800 outline-none cursor-pointer focus:border-blue-500 truncate disabled:bg-slate-100 disabled:cursor-default"
                  >
                    {shopsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (id: {s.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Danh sách Links điều hướng Router */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
                Chức năng chính
              </div>

              {navItems.map((item) => {
                // Ẩn tab admin nếu là Provider hoặc nếu đang ở chế độ Người Bán
                if (item.adminOnly && (isProviderOnly || viewMode !== "ADMIN")) return null;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                      item.isActive
                        ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <IconComponent
                      className={`w-4.5 h-4.5 ${
                        item.isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>Quay về trang chủ</span>
              </Link>
              <div className="flex items-center justify-between px-3 text-[11px] text-slate-400">
                <span>{isProviderOnly ? "Kênh đối tác" : "Hệ thống CleanMate"}</span>
                <span className="font-semibold">v1.4.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* VÙNG NỘI DUNG CHÍNH (DYNAMIC ROUTE CHILDREN) */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 tracking-wider hidden sm:inline-block">
                {isProviderOnly
                  ? `Đối tác: ${currentUser?.fullName || "Gian hàng"}`
                  : viewMode === "ADMIN"
                  ? "Toàn sàn CleanMate"
                  : "Kênh Người Bán"}
              </span>
            </div>
          </header>

          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
