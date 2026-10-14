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
} from "lucide-react";

interface AdminContextType {
  viewMode: "ADMIN" | "SELLER";
  setViewMode: (mode: "ADMIN" | "SELLER") => void;
  selectedSellerId: number;
  setSelectedSellerId: (id: number) => void;
  shopsList: { id: number; name: string }[];
  showToast: (msg: string) => void;
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

  const [viewMode, setViewMode] = useState<"ADMIN" | "SELLER">("ADMIN");
  const [selectedSellerId, setSelectedSellerId] = useState<number>(1);
  const [shopsList, setShopsList] = useState<{ id: number; name: string }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tải danh sách shops để phục vụ selector
  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch("/api/admin/providers?status=APPROVED");
        const json = await res.json();
        if (json.success && json.shops && json.shops.length > 0) {
          setShopsList(json.shops.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
          setSelectedSellerId(json.shops[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadShops();
  }, []);

  // Xác thực quyền ADMIN
  useEffect(() => {
    let isCancelled = false;
    async function verifyAdminRole() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.authenticated || data.user?.role !== "ADMIN") {
          if (!isCancelled) {
            setIsAuthorized(false);
            setIsCheckingAuth(false);
            router.replace("/login");
          }
          return;
        }
        if (!isCancelled) {
          setIsAuthorized(true);
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error("Lỗi xác thực quyền ADMIN:", err);
        if (!isCancelled) {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          router.replace("/login");
        }
      }
    }
    verifyAdminRole();
    return () => {
      isCancelled = true;
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <h2 className="text-base font-semibold text-slate-700">Đang kiểm tra quyền Admin...</h2>
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
          Trang quản trị chỉ dành riêng cho tài khoản có vai trò Quản Trị Viên (ADMIN).
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition"
        >
          Đăng nhập bằng tài khoản ADMIN
        </Link>
      </div>
    );
  }

  // Tiêu đề tương ứng với route đang truy cập
  const getPageTitle = () => {
    if (pathname === "/admin" || pathname === "/admin/analytics") return "Báo cáo Thống kê & Doanh thu";
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
    return "Quản Trị Hệ Thống CleanMate";
  };

  const navItems = [
    {
      label: "Thống kê & Biểu đồ",
      href: "/admin",
      icon: BarChart3,
      adminOnly: false,
      isActive: pathname === "/admin" || pathname === "/admin/analytics",
    },
    {
      label: "Phân quyền (RBAC)",
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
      label: viewMode === "ADMIN" ? "Quản lý Dịch vụ" : "Dịch vụ của tôi",
      href: "/admin/services",
      icon: Layers,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/services"),
    },
    {
      label: viewMode === "ADMIN" ? "Quản lý Đơn hàng" : "Đơn hàng nhận việc",
      href: "/admin/bookings",
      icon: CalendarCheck,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/bookings"),
    },
    {
      label: viewMode === "ADMIN" ? "Tài chính & Hoa hồng" : "Ví & Rút tiền",
      href: "/admin/finance",
      icon: DollarSign,
      adminOnly: false,
      isActive: pathname.startsWith("/admin/finance"),
    },
  ];

  return (
    <AdminContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedSellerId,
        setSelectedSellerId,
        shopsList,
        showToast,
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Không gian quản lý
              </div>
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

              {/* Dropdown chọn Shop đối tác nếu đang ở Kênh Người Bán */}
              {viewMode === "SELLER" && (
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 px-1">
                    Chọn gian hàng:
                  </label>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-2.5 rounded-xl shadow-2xs text-slate-800 outline-none cursor-pointer focus:border-blue-500 truncate"
                  >
                    {shopsList.length > 0 ? (
                      shopsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (id: {s.id})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Vệ sinh Sạch Bóng (id: 1)</option>
                        <option value={2}>CleanPro (id: 2)</option>
                        <option value={3}>Sài Gòn Xanh (id: 3)</option>
                      </>
                    )}
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
                if (item.adminOnly && viewMode !== "ADMIN") return null;
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
                <span>Hệ thống CleanMate</span>
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
                {viewMode === "ADMIN" ? "Toàn sàn CleanMate" : "Kênh Người Bán"}
              </span>
            </div>
          </header>

          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
