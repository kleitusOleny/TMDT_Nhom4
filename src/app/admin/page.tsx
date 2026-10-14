"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BarChart3,
  Users,
  Layers,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Building2,
  Plus,
  Loader2,
  ArrowUpRight,
  Eye,
  Check,
  Ban,
  RefreshCw,
  Home,
  Store,
  ChevronDown,
  Menu,
  X,
  Edit,
  Trash2,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import InteractiveColumnChart, {
  ColumnDataPoint,
} from "@/src/components/charts/InteractiveColumnChart";
import InteractiveDonutChart, {
  DonutItem,
} from "@/src/components/charts/InteractiveDonutChart";
import { UserRecord, ProviderRecord, ServiceRecord, BookingRecord } from "@/src/lib/admin-data";
import {
  BookingDetailModal,
  UserFormModal,
  ProviderFormModal,
  ServiceEditModal,
  CreateBookingModal,
} from "@/src/components/admin/AdminModals";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Kiểm tra xác thực quyền ADMIN
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Chế độ xem: "ADMIN" (Toàn sàn) hoặc "SELLER" (Kênh Người Bán)
  const [viewMode, setViewMode] = useState<"ADMIN" | "SELLER">("ADMIN");
  const [selectedSellerId, setSelectedSellerId] = useState<number>(1);

  // Tab đang kích hoạt: "analytics" | "users" | "providers" | "services" | "bookings" | "finance"
  const [activeTab, setActiveTab] = useState<
    "analytics" | "users" | "providers" | "services" | "bookings" | "finance"
  >("analytics");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bộ lọc ngày
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 6);
  const [fromDate, setFromDate] = useState(defaultFromDate.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(todayStr);
  const [metricType, setMetricType] = useState<"revenue" | "orders">("revenue");

  // State dữ liệu thống kê
  const [columnData, setColumnData] = useState<ColumnDataPoint[]>([]);
  const [donutStatus, setDonutStatus] = useState<DonutItem[]>([]);
  const [donutCategory, setDonutCategory] = useState<DonutItem[]>([]);
  const [donutPayment, setDonutPayment] = useState<DonutItem[]>([]);
  const [kpiData, setKpiData] = useState<Record<string, number>>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [shopsList, setShopsList] = useState<{ id: number; name: string }[]>([]);

  // State quản lý danh sách
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [providersList, setProvidersList] = useState<ProviderRecord[]>([]);
  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);
  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);

  // State bộ lọc chi tiết cho từng tab
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [providerStatusFilter, setProviderStatusFilter] = useState("ALL");
  const [providerSearchQuery, setProviderSearchQuery] = useState("");

  const [serviceStatusFilter, setServiceStatusFilter] = useState("ALL");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("ALL");
  const [serviceShopFilter, setServiceShopFilter] = useState("ALL");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState("ALL");
  const [bookingShopFilter, setBookingShopFilter] = useState("ALL");
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");

  // Modals state
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderRecord | null>(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);

  const [createBookingModalOpen, setCreateBookingModalOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Tải Thống kê
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const endpoint =
        viewMode === "ADMIN"
          ? `/api/admin/analytics?from=${fromDate}&to=${toDate}`
          : `/api/seller/analytics?sellerId=${selectedSellerId}&from=${fromDate}&to=${toDate}`;

      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        setColumnData(json.charts?.columnChartData || []);
        setDonutStatus(json.charts?.donutStatusData || []);
        setDonutCategory(
          viewMode === "ADMIN"
            ? json.charts?.donutCategoryData || []
            : json.charts?.donutServiceData || []
        );
        if (json.charts?.donutPaymentData) {
          setDonutPayment(json.charts.donutPaymentData);
        }
        setKpiData(json.kpi || {});
        if (json.shops && json.shops.length > 0) {
          setShopsList(json.shops);
          if (!selectedSellerId && json.shops[0]) {
            setSelectedSellerId(json.shops[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // 2. Tải Người dùng
  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `/api/admin/users?role=${userRoleFilter}&status=${userStatusFilter}&q=${encodeURIComponent(userSearchQuery)}`
      );
      const json = await res.json();
      if (json.success) setUsersList(json.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Tải Nhà cung cấp (Providers / Shops)
  const fetchProviders = async () => {
    try {
      const res = await fetch(
        `/api/admin/providers?status=${providerStatusFilter}&q=${encodeURIComponent(providerSearchQuery)}`
      );
      const json = await res.json();
      if (json.success) setProvidersList(json.shops || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Tải Dịch vụ (có lọc theo Nhà cung cấp, Danh mục, Trạng thái, Tìm kiếm)
  const fetchServices = async () => {
    try {
      let shopParam = "";
      if (viewMode === "SELLER") {
        shopParam = `&sellerId=${selectedSellerId}`;
      } else if (serviceShopFilter !== "ALL") {
        shopParam = `&sellerId=${serviceShopFilter}`;
      }

      const res = await fetch(
        `/api/admin/services?status=${serviceStatusFilter}&category=${serviceCategoryFilter}&q=${encodeURIComponent(
          serviceSearchQuery
        )}${shopParam}`
      );
      const json = await res.json();
      if (json.success) setServicesList(json.services || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Tải Đơn đặt lịch (có lọc theo Nhà cung cấp, Trạng thái, Thanh toán, Tìm kiếm)
  const fetchBookings = async () => {
    try {
      let shopParam = "";
      if (viewMode === "SELLER") {
        shopParam = `&sellerId=${selectedSellerId}`;
      } else if (bookingShopFilter !== "ALL") {
        shopParam = `&sellerId=${bookingShopFilter}`;
      }

      const res = await fetch(
        `/api/admin/bookings?status=${bookingStatusFilter}&paymentMethod=${bookingPaymentFilter}&q=${encodeURIComponent(
          bookingSearchQuery
        )}${shopParam}`
      );
      const json = await res.json();
      if (json.success) setBookingsList(json.bookings || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Kiểm tra quyền Admin
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

  useEffect(() => {
    if (!isAuthorized) return;
    const timeoutId = window.setTimeout(() => {
      fetchAnalytics();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, fromDate, toDate, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timeoutId = window.setTimeout(() => {
      if (activeTab === "users") fetchUsers();
      if (activeTab === "providers") fetchProviders();
      if (activeTab === "services") fetchServices();
      if (activeTab === "bookings") fetchBookings();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [
    activeTab,
    viewMode,
    selectedSellerId,
    userRoleFilter,
    userStatusFilter,
    userSearchQuery,
    providerStatusFilter,
    providerSearchQuery,
    serviceStatusFilter,
    serviceCategoryFilter,
    serviceShopFilter,
    serviceSearchQuery,
    bookingStatusFilter,
    bookingPaymentFilter,
    bookingShopFilter,
    bookingSearchQuery,
    isAuthorized,
  ]);

  // Handler: User CRUD
  const handleSaveUser = async (data: {
    userId?: number;
    fullName: string;
    phone: string;
    email: string;
    role: string;
    status?: string;
  }) => {
    try {
      const method = data.userId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.userId ? "Cập nhật tài khoản thành công!" : "Tạo tài khoản mới thành công!");
        setUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/vô hiệu hóa tài khoản "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa tài khoản "${name}"`);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserStatus = async (user: UserRecord) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${newStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản ${user.fullName}`);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Provider CRUD
  const handleSaveProvider = async (data: {
    shopId?: number;
    name: string;
    area: string;
    address: string;
    description: string;
    approvalStatus: string;
  }) => {
    try {
      const method = data.shopId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.shopId ? "Cập nhật nhà cung cấp thành công!" : "Đăng ký nhà cung cấp mới thành công!");
        setProviderModalOpen(false);
        setEditingProvider(null);
        fetchProviders();
        fetchAnalytics(); // Cập nhật lại danh sách shop ở selector
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProvider = async (shopId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/vô hiệu hóa nhà cung cấp "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/providers?id=${shopId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa nhà cung cấp "${name}"`);
        fetchProviders();
        fetchAnalytics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Service CRUD
  const handleSaveService = async (data: {
    serviceId?: number;
    name: string;
    category: string;
    sellerId: number;
    price: number;
    unit: string;
    status: string;
    description?: string;
  }) => {
    try {
      const method = data.serviceId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.serviceId ? "Cập nhật dịch vụ thành công!" : "Tạo dịch vụ mới thành công!");
        setServiceModalOpen(false);
        setEditingService(null);
        fetchServices();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (serviceId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/ẩn dịch vụ "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/services?id=${serviceId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa dịch vụ "${name}"`);
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateServiceStatus = async (
    serviceId: number,
    newStatus: "APPROVED" | "REJECTED" | "INACTIVE"
  ) => {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Cập nhật trạng thái dịch vụ thành công!");
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Booking CRUD
  const handleSaveBooking = async (data: {
    serviceId: number;
    customerId: number;
    scheduledDate: string;
    address: string;
    note: string;
    totalPrice: number;
    paymentMethod: string;
  }) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast("Tạo đơn đặt dịch vụ thành công!");
        setCreateBookingModalOpen(false);
        fetchBookings();
        fetchAnalytics();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật trạng thái đơn ${bookingId}`);
        fetchBookings();
        fetchAnalytics();
        if (viewingBooking && viewingBooking.id === bookingId) {
          setViewingBooking({ ...viewingBooking, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng "${bookingId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã hủy đơn hàng ${bookingId}`);
        fetchBookings();
        fetchAnalytics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Xuất báo cáo CSV
  const handleExportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Ngày,Doanh thu (VND),Hoa hồng sàn,Người bán nhận,Số đơn hàng\n" +
      columnData
        .map(
          (d) =>
            `${d.date},${d.totalRevenue},${d.platformFee || 0},${d.sellerRevenue || 0},${d.orderCount}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCao_CleanMate_${fromDate}_den_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file CSV báo cáo tài chính thành công!");
  };

  // Format VND
  const formatVND = (amount: number | undefined) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

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

  return (
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

      {/* ========================================================
          SIDEBAR NAVIGATION (CỘT ĐIỀU HƯỚNG TRÁI)
      ======================================================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand CleanMate */}
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

          {/* Mode Switcher: Toàn sàn (Admin) vs Kênh Người Bán (Seller) */}
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

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Chức năng chính
            </div>

            <button
              onClick={() => {
                setActiveTab("analytics");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BarChart3 className={`w-4.5 h-4.5 ${activeTab === "analytics" ? "text-blue-600" : "text-slate-400"}`} />
              <span>Thống kê & Biểu đồ</span>
            </button>

            {viewMode === "ADMIN" && (
              <>
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    activeTab === "users"
                      ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className={`w-4.5 h-4.5 ${activeTab === "users" ? "text-blue-600" : "text-slate-400"}`} />
                  <span>Phân quyền (RBAC)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("providers");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    activeTab === "providers"
                      ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Building2 className={`w-4.5 h-4.5 ${activeTab === "providers" ? "text-blue-600" : "text-slate-400"}`} />
                  <span>Quản lý Nhà cung cấp</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setActiveTab("services");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "services"
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layers className={`w-4.5 h-4.5 ${activeTab === "services" ? "text-blue-600" : "text-slate-400"}`} />
              <span>{viewMode === "ADMIN" ? "Quản lý Dịch vụ" : "Dịch vụ của tôi"}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("bookings");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CalendarCheck className={`w-4.5 h-4.5 ${activeTab === "bookings" ? "text-blue-600" : "text-slate-400"}`} />
              <span>{viewMode === "ADMIN" ? "Quản lý Đơn hàng" : "Đơn hàng nhận việc"}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("finance");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "finance"
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <DollarSign className={`w-4.5 h-4.5 ${activeTab === "finance" ? "text-blue-600" : "text-slate-400"}`} />
              <span>{viewMode === "ADMIN" ? "Tài chính & Hoa hồng" : "Ví & Rút tiền"}</span>
            </button>
          </nav>

          {/* Footer Sidebar: Về trang chủ */}
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
              <span className="font-semibold">v1.3.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          VÙNG NỘI DUNG CHÍNH (RIGHT CONTENT AREA)
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar cho Mobile & Header Title */}
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
                {activeTab === "analytics" && "Báo cáo Thống kê & Doanh thu"}
                {activeTab === "users" && "Phân quyền Tài khoản & Người dùng (RBAC)"}
                {activeTab === "providers" && "Quản lý Nhà cung cấp & Đối tác dịch vụ"}
                {activeTab === "services" && (viewMode === "ADMIN" ? "Quản trị Danh mục Dịch vụ" : "Dịch vụ của Shop")}
                {activeTab === "bookings" && (viewMode === "ADMIN" ? "Quản lý Lịch hẹn & Đơn đặt dịch vụ" : "Đơn hàng nhận việc")}
                {activeTab === "finance" && (viewMode === "ADMIN" ? "Báo cáo Tài chính & Hoa hồng 15%" : "Ví doanh thu & Rút tiền")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 tracking-wider hidden sm:inline-block">
              {viewMode === "ADMIN" ? "Toàn sàn CleanMate" : "Kênh Người Bán"}
            </span>
          </div>
        </header>

        {/* 3. NỘI DUNG CHÍNH (MAIN BODY) */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* ========================================================
              TAB 1: THỐNG KÊ BIỂU ĐỒ (ANALYTICS & CHARTS)
          ======================================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Thanh điều khiển bộ lọc thời gian */}
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Từ ngày:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Đến ngày:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc dữ liệu</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất báo cáo CSV</span>
                  </button>
                </div>
              </div>

              {/* Hàng 4 Thẻ KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {viewMode === "ADMIN" ? "Tổng Doanh Thu Sàn" : "Doanh Thu Đơn Vị"}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatVND(
                      viewMode === "ADMIN" ? kpiData.totalRevenue : kpiData.totalGrossRevenue
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Dữ liệu thực tế từ database</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {viewMode === "ADMIN" ? "Hoa Hồng Sàn (15%)" : "Doanh Thu Thực Nhận"}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatVND(
                      viewMode === "ADMIN" ? kpiData.platformFee : kpiData.totalNetEarnings
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {viewMode === "ADMIN" ? "Chiết khấu giữ lại nền tảng" : "Sau khi trích chiết khấu"}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tổng Số Đơn Dịch Vụ
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {kpiData.totalOrders || 0}{" "}
                    <span className="text-sm font-normal text-slate-400">đơn</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Tỷ lệ hoàn thành:{" "}
                    <span className="font-semibold text-slate-700">
                      {kpiData.completedRate || 100}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {viewMode === "ADMIN" ? "Đối Tác / Tài Khoản" : "Số Dư Ví Khả Dụng"}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      {viewMode === "ADMIN" ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {viewMode === "ADMIN"
                      ? `${kpiData.totalSellers || shopsList.length} đối tác`
                      : formatVND(kpiData.walletBalance || 0)}
                  </div>
                  <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-1">
                    {viewMode === "ADMIN" ? (
                      <span>{kpiData.totalUsers || 0} tài khoản đăng ký</span>
                    ) : (
                      <span>Sẵn sàng rút về tài khoản</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Biểu đồ cột */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Biểu Đồ Cột: Thống Kê Theo Thời Gian
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dữ liệu hiển thị từ ngày{" "}
                      <span className="font-semibold text-slate-700">{fromDate}</span> đến ngày{" "}
                      <span className="font-semibold text-slate-700">{toDate}</span>
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setMetricType("revenue")}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        metricType === "revenue"
                          ? "bg-white text-blue-600 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Doanh thu (VNĐ)
                    </button>
                    <button
                      onClick={() => setMetricType("orders")}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        metricType === "orders"
                          ? "bg-white text-blue-600 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Số lượng đơn
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  {loadingAnalytics ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : columnData.length > 0 ? (
                    <InteractiveColumnChart
                      data={columnData}
                      metricType={metricType}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                      Không có phát sinh đơn hàng trong khoảng ngày đã chọn
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 2 Biểu đồ tròn */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Tỷ Lệ Trạng Thái Đơn Hàng
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phân bổ tỷ lệ đơn hoàn tất, đang làm, chờ duyệt & hủy
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <InteractiveDonutChart data={donutStatus} centerLabel="Trạng Thái" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {viewMode === "ADMIN"
                          ? "Cơ Cấu Doanh Thu Theo Danh Mục"
                          : "Phân Bổ Doanh Thu Theo Gói Dịch Vụ"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Thị phần đóng góp vào tổng doanh số thực tế
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <InteractiveDonutChart
                      data={donutCategory}
                      centerLabel={viewMode === "ADMIN" ? "Danh Mục" : "Dịch Vụ"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: PHÂN QUYỀN RBAC & QUẢN LÝ NGƯỜI DÙNG
          ======================================================== */}
          {activeTab === "users" && viewMode === "ADMIN" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                    Phân Quyền Người Dùng Theo RBAC
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý tài khoản, gán vai trò: CUSTOMER, STAFF, PROVIDER, ADMIN và khóa/mở khóa
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tài khoản mới</span>
                </button>
              </div>

              {/* Bộ lọc chi tiết cho tab Người dùng */}
              <div className="px-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, email, SĐT hoặc tên shop..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                  <option value="STAFF">Nhân viên sàn (STAFF)</option>
                  <option value="SELLER">Nhà cung cấp (PROVIDER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="BLOCKED">Bị khóa</option>
                </select>
              </div>

              {/* Bảng danh sách người dùng */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Họ & Tên</th>
                      <th className="px-6 py-3.5">Số điện thoại</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Vai trò (RBAC)</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5">Ngày tham gia</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div>{user.fullName}</div>
                            {user.sellerName && (
                              <div className="text-[11px] text-blue-600 font-normal">
                                🏢 {user.sellerName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono">{user.phone}</td>
                        <td className="px-6 py-4">{user.email || "—"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-700"
                                : user.role === "STAFF"
                                ? "bg-amber-100 text-amber-700"
                                : user.role === "SELLER"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.actualRole || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {user.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{user.joinedDate}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setUserModalOpen(true);
                              }}
                              title="Sửa / Phân quyền"
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              title={user.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                user.status === "ACTIVE"
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {user.status === "ACTIVE" ? (
                                <Ban className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {user.role !== "ADMIN" && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.fullName)}
                                title="Xóa tài khoản"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: QUẢN LÝ NHÀ CUNG CẤP (PROVIDERS / SHOPS)
          ======================================================== */}
          {activeTab === "providers" && viewMode === "ADMIN" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Quản Lý Nhà Cung Cấp & Đối Tác
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phê duyệt, kiểm tra thông tin, quản lý địa bàn và dịch vụ của từng đối tác
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProvider(null);
                    setProviderModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm nhà cung cấp mới</span>
                </button>
              </div>

              {/* Bộ lọc chi tiết cho Nhà cung cấp */}
              <div className="px-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={providerSearchQuery}
                    onChange={(e) => setProviderSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên doanh nghiệp, khu vực, chủ sở hữu..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={providerStatusFilter}
                  onChange={(e) => setProviderStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái xét duyệt</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                  <option value="PENDING">Chờ xét duyệt (PENDING)</option>
                  <option value="REJECTED">Từ chối (REJECTED)</option>
                </select>
              </div>

              {/* Bảng danh sách nhà cung cấp */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Doanh nghiệp / Shop</th>
                      <th className="px-6 py-3.5">Chủ sở hữu</th>
                      <th className="px-6 py-3.5">Khu vực phục vụ</th>
                      <th className="px-6 py-3.5">Số gói dịch vụ</th>
                      <th className="px-6 py-3.5">Đánh giá</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {providersList.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              🏢
                            </span>
                            <div>
                              <div>{shop.name}</div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                ID: #{shop.id} • {shop.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{shop.ownerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{shop.ownerPhone}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-600">{shop.area}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">
                          {shop.servicesCount} gói
                        </td>
                        <td className="px-6 py-4 text-amber-500 font-semibold">
                          ★ {shop.rating.toFixed(1)} ({shop.totalReviews} đánh giá)
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              shop.approvalStatus === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : shop.approvalStatus === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {shop.approvalStatus === "APPROVED"
                              ? "Đã phê duyệt"
                              : shop.approvalStatus === "PENDING"
                              ? "Chờ duyệt"
                              : "Bị từ chối"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút lọc nhanh dịch vụ của nhà cung cấp này */}
                            <button
                              onClick={() => {
                                setServiceShopFilter(shop.id.toString());
                                setActiveTab("services");
                              }}
                              title="Xem dịch vụ của shop này"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProvider(shop);
                                setProviderModalOpen(true);
                              }}
                              title="Sửa thông tin"
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(shop.id, shop.name)}
                              title="Xóa nhà cung cấp"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: QUẢN LÝ DỊCH VỤ (SERVICES) - ADMIN & SELLER
          ======================================================== */}
          {activeTab === "services" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewMode === "ADMIN" ? "Quản Lý Dịch Vụ Toàn Sàn" : "Dịch Vụ Của Đơn Vị"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý chi tiết từng gói dịch vụ, lọc theo từng nhà cung cấp và danh mục
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingService(null);
                    setServiceModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dịch vụ mới</span>
                </button>
              </div>

              {/* Bộ lọc chi tiết cho tab Dịch vụ */}
              <div className="px-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên dịch vụ hoặc mô tả..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bộ lọc theo Nhà cung cấp (Dành cho Admin) */}
                {viewMode === "ADMIN" && (
                  <select
                    value={serviceShopFilter}
                    onChange={(e) => setServiceShopFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">🏢 Tất cả nhà cung cấp</option>
                    {shopsList.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả nhóm danh mục</option>
                  <option value="ve-sinh-nha-o">Vệ sinh nhà ở</option>
                  <option value="ve-sinh-van-phong">Vệ sinh văn phòng</option>
                  <option value="ve-sinh-cong-nghiep">Sau xây dựng</option>
                  <option value="giat-sofa-nem">Giặt sofa & nệm</option>
                  <option value="ve-sinh-may-lanh">Vệ sinh máy lạnh</option>
                </select>

                <select
                  value={serviceStatusFilter}
                  onChange={(e) => setServiceStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt (Active)</option>
                  <option value="PENDING">Chờ duyệt (Pending)</option>
                  <option value="INACTIVE">Tạm ẩn (Inactive)</option>
                </select>
              </div>

              {/* Bảng dịch vụ */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Tên Dịch Vụ</th>
                      <th className="px-6 py-3.5">Danh mục</th>
                      <th className="px-6 py-3.5">Đơn vị cung cấp</th>
                      <th className="px-6 py-3.5">Giá niêm yết</th>
                      <th className="px-6 py-3.5">Đánh giá</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {servicesList.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">
                          {srv.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                            {srv.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-blue-600 font-medium">
                          {srv.sellerName}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {formatVND(srv.price)} / {srv.unit}
                        </td>
                        <td className="px-6 py-4 text-amber-500 font-semibold">
                          ★ {srv.rating > 0 ? srv.rating.toFixed(1) : "5.0"} ({srv.completedBookings} đơn)
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              srv.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : srv.status === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {srv.status === "APPROVED"
                              ? "Đã duyệt"
                              : srv.status === "PENDING"
                              ? "Chờ duyệt"
                              : "Tạm ẩn"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {viewMode === "ADMIN" && srv.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateServiceStatus(srv.id, "APPROVED")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                              >
                                Duyệt
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingService(srv);
                                setServiceModalOpen(true);
                              }}
                              title="Sửa dịch vụ"
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateServiceStatus(
                                  srv.id,
                                  srv.status === "APPROVED" ? "INACTIVE" : "APPROVED"
                                )
                              }
                              title={srv.status === "APPROVED" ? "Ẩn dịch vụ" : "Hiện dịch vụ"}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                            >
                              {srv.status === "APPROVED" ? <Ban className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv.id, srv.name)}
                              title="Xóa dịch vụ"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: QUẢN LÝ ĐƠN HÀNG (BOOKINGS & ORDERS)
          ======================================================== */}
          {activeTab === "bookings" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewMode === "ADMIN" ? "Quản Lý Đơn Đặt Dịch Vụ" : "Đơn Đặt Của Đơn Vị"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xem chi tiết đơn hàng, ảnh nghiệm thu, cập nhật trạng thái và hủy đơn
                  </p>
                </div>

                <button
                  onClick={() => setCreateBookingModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo đơn đặt mới</span>
                </button>
              </div>

              {/* Bộ lọc chi tiết cho tab Đơn hàng */}
              <div className="px-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    placeholder="Tìm mã đơn, tên khách, SĐT hoặc địa chỉ..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                {viewMode === "ADMIN" && (
                  <select
                    value={bookingShopFilter}
                    onChange={(e) => setBookingShopFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">🏢 Tất cả nhà cung cấp</option>
                    {shopsList.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái đơn</option>
                  <option value="PENDING">Chờ duyệt (PENDING)</option>
                  <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                  <option value="IN_PROGRESS">Đang dọn dẹp (IN_PROGRESS)</option>
                  <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
                  <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                </select>

                <select
                  value={bookingPaymentFilter}
                  onChange={(e) => setBookingPaymentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Phương thức thanh toán</option>
                  <option value="CASH">Tiền mặt (COD)</option>
                  <option value="VNPAY">VNPAY</option>
                  <option value="MOMO">MOMO</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                </select>
              </div>

              {/* Bảng đơn hàng */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Mã đơn</th>
                      <th className="px-6 py-3.5">Khách hàng</th>
                      <th className="px-6 py-3.5">Dịch vụ & Đối tác</th>
                      <th className="px-6 py-3.5">Thời gian & Địa chỉ</th>
                      <th className="px-6 py-3.5">Tổng tiền</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bookingsList.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          <button
                            onClick={() => setViewingBooking(booking)}
                            className="hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{booking.id}</span>
                            <Eye className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {booking.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">{booking.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{booking.serviceName}</div>
                          <div className="text-[11px] text-blue-600">🏢 {booking.sellerName}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-slate-900">
                            📅 {booking.bookingDate} ({booking.bookingTime})
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            📍 {booking.address}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {formatVND(booking.totalAmount)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {viewMode === "ADMIN"
                              ? `Hoa hồng: +${formatVND(booking.commissionFee)}`
                              : `Shop nhận: ${formatVND(booking.sellerEarnings)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                            {booking.status === "COMPLETED" && <Check className="w-3 h-3" />}
                            {booking.status === "IN_PROGRESS" && (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            )}
                            {booking.status === "PENDING" && <Clock className="w-3 h-3" />}
                            {booking.status === "CANCELLED" && <Ban className="w-3 h-3" />}
                            {booking.status === "COMPLETED"
                              ? "Hoàn tất"
                              : booking.status === "IN_PROGRESS"
                              ? "Đang dọn"
                              : booking.status === "CONFIRMED"
                              ? "Đã nhận đơn"
                              : booking.status === "PENDING"
                              ? "Chờ duyệt"
                              : "Đã hủy"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <button
                              onClick={() => setViewingBooking(booking)}
                              title="Xem chi tiết đơn hàng"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {booking.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Nhận đơn
                              </button>
                            )}
                            {booking.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "IN_PROGRESS")}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Bắt đầu
                              </button>
                            )}
                            {booking.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "COMPLETED")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Nghiệm thu
                              </button>
                            )}
                            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                title="Hủy đơn"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: TÀI CHÍNH & HOA HỒNG (FINANCE & PAYOUT)
          ======================================================== */}
          {activeTab === "finance" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <h3 className="text-base font-bold text-slate-900">
                  {viewMode === "ADMIN" ? "Ví Thu Hộ & Hoa Hồng Sàn" : "Số Dư Ví Đối Soát"}
                </h3>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
                  <span className="text-xs uppercase font-medium text-blue-100">
                    Số dư khả dụng
                  </span>
                  <div className="text-3xl font-black mt-2">
                    {formatVND(
                      viewMode === "ADMIN"
                        ? kpiData.platformFee || 0
                        : kpiData.walletBalance || 0
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
                    <span>Chu kỳ đối soát: Hàng tuần</span>
                    <span className="font-semibold text-white">Thứ 6 hàng tuần</span>
                  </div>
                </div>

                {viewMode === "SELLER" && (
                  <button
                    onClick={() =>
                      showToast(
                        `Đã gửi yêu cầu rút tiền ${formatVND(
                          kpiData.walletBalance
                        )} tới ban quản trị CleanMate!`
                      )
                    }
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    Tạo yêu cầu rút tiền về tài khoản
                  </button>
                )}
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  Lịch Sử Đối Soát & Giao Dịch
                </h3>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">
                        Rút tiền về Vietcombank (STK: 0071000123xxx)
                      </div>
                      <div className="text-slate-400 mt-0.5">Mã GD: #WD-2026-981 • 05/10/2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">+15.800.000 ₫</div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Thành công
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">
                        Đối soát định kỳ đơn hàng Tuần 39
                      </div>
                      <div className="text-slate-400 mt-0.5">Mã GD: #ST-2026-442 • 28/09/2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">+22.450.000 ₫</div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        Đã tất toán
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          CÁC MODAL THAO TÁC XEM / THÊM / SỬA CHI TIẾT
      ======================================================== */}
      {/* 1. Modal Chi tiết Đơn hàng */}
      {viewingBooking && (
        <BookingDetailModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
        />
      )}

      {/* 2. Modal Thêm / Sửa / Phân quyền User */}
      {userModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setUserModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSaveUser}
        />
      )}

      {/* 3. Modal Thêm / Sửa Nhà cung cấp */}
      {providerModalOpen && (
        <ProviderFormModal
          provider={editingProvider}
          onClose={() => {
            setProviderModalOpen(false);
            setEditingProvider(null);
          }}
          onSubmit={handleSaveProvider}
        />
      )}

      {/* 4. Modal Thêm / Sửa Dịch vụ */}
      {serviceModalOpen && (
        <ServiceEditModal
          service={
            editingService || {
              id: 0,
              name: "",
              category: "home",
              categoryName: "Vệ sinh nhà ở",
              sellerId: shopsList[0]?.id || 1,
              sellerName: shopsList[0]?.name || "Shop",
              price: 250000,
              unit: "gói",
              status: "APPROVED",
              rating: 5,
              completedBookings: 0,
            }
          }
          shopsList={shopsList}
          onClose={() => {
            setServiceModalOpen(false);
            setEditingService(null);
          }}
          onSubmit={handleSaveService}
        />
      )}

      {/* 5. Modal Tạo Đơn hàng Mới */}
      {createBookingModalOpen && (
        <CreateBookingModal
          servicesList={servicesList}
          usersList={usersList}
          onClose={() => setCreateBookingModalOpen(false)}
          onSubmit={handleSaveBooking}
        />
      )}
    </div>
  );
}
