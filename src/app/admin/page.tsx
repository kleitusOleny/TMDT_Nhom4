"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
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
  ArrowUpRight,
  Eye,
  Check,
  Ban,
  RefreshCw,
  Home,
  Store,
  ChevronDown,
} from "lucide-react";
import InteractiveColumnChart, {
  ColumnDataPoint,
} from "@/src/components/charts/InteractiveColumnChart";
import InteractiveDonutChart, {
  DonutItem,
} from "@/src/components/charts/InteractiveDonutChart";
import { UserRecord, ServiceRecord, BookingRecord } from "@/src/lib/admin-data";

export default function AdminDashboardPage() {
  const [, startTransition] = useTransition();

  // Chế độ xem: "ADMIN" (Toàn sàn) hoặc "SELLER" (Kênh Người Bán)
  const [viewMode, setViewMode] = useState<"ADMIN" | "SELLER">("ADMIN");
  const [selectedSellerId, setSelectedSellerId] = useState<number>(2); // 2: CleanPro, 3: Sài Gòn Xanh, 4: CleanPlus

  // Tab đang kích hoạt: "analytics" | "users" | "services" | "bookings" | "finance"
  const [activeTab, setActiveTab] = useState<
    "analytics" | "users" | "services" | "bookings" | "finance"
  >("analytics");

  // Bộ lọc ngày (Mặc định 7 ngày gần nhất)
  const todayStr = "2026-10-12";
  const [fromDate, setFromDate] = useState("2026-10-06");
  const [toDate, setToDate] = useState(todayStr);
  const [metricType, setMetricType] = useState<"revenue" | "orders">("revenue");

  // State dữ liệu thống kê
  const [columnData, setColumnData] = useState<ColumnDataPoint[]>([]);
  const [donutStatus, setDonutStatus] = useState<DonutItem[]>([]);
  const [donutCategory, setDonutCategory] = useState<DonutItem[]>([]);
  const [donutPayment, setDonutPayment] = useState<DonutItem[]>([]);
  const [kpiData, setKpiData] = useState<Record<string, number>>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // State quản lý danh sách
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);
  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);

  // State tìm kiếm & bộ lọc
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("ALL");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");

  // Modal tạo dịch vụ mới (Dành cho Seller hoặc Admin tạo thay)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("home");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceUnit, setNewServiceUnit] = useState("giờ");

  // Thông báo Toast nhanh
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Tải dữ liệu Thống kê theo ngày và chế độ xem
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
        setColumnData(json.charts.columnChartData || []);
        setDonutStatus(json.charts.donutStatusData || []);
        setDonutCategory(
          viewMode === "ADMIN"
            ? json.charts.donutCategoryData || []
            : json.charts.donutServiceData || []
        );
        if (json.charts.donutPaymentData) {
          setDonutPayment(json.charts.donutPaymentData);
        }
        setKpiData(json.kpi || {});
      }
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // 2. Tải danh sách Người dùng
  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `/api/admin/users?role=${userRoleFilter}&q=${encodeURIComponent(userSearchQuery)}`
      );
      const json = await res.json();
      if (json.success) setUsersList(json.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Tải danh sách Dịch vụ
  const fetchServices = async () => {
    try {
      const sellerParam = viewMode === "SELLER" ? `&sellerId=${selectedSellerId}` : "";
      const res = await fetch(
        `/api/admin/services?status=${serviceStatusFilter}${sellerParam}`
      );
      const json = await res.json();
      if (json.success) setServicesList(json.services || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Tải danh sách Đơn đặt lịch
  const fetchBookings = async () => {
    try {
      const sellerParam = viewMode === "SELLER" ? `&sellerId=${selectedSellerId}` : "";
      const res = await fetch(
        `/api/admin/bookings?status=${bookingStatusFilter}&q=${encodeURIComponent(bookingSearchQuery)}${sellerParam}`
      );
      const json = await res.json();
      if (json.success) setBookingsList(json.bookings || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchAnalytics();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, fromDate, toDate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (activeTab === "users") fetchUsers();
      if (activeTab === "services") fetchServices();
      if (activeTab === "bookings") fetchBookings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeTab,
    viewMode,
    selectedSellerId,
    userRoleFilter,
    userSearchQuery,
    serviceStatusFilter,
    bookingStatusFilter,
    bookingSearchQuery,
  ]);

  // Hành động: Khóa / Mở khóa người dùng
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
        showToast(`Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "khóa"} tài khoản ${user.fullName}`);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Hành động: Duyệt / Từ chối dịch vụ
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

  // Hành động: Cập nhật trạng thái đơn
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Hành động: Thêm mới dịch vụ
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;

    try {
      const categoryNames: Record<string, string> = {
        home: "Vệ sinh nhà ở",
        office: "Vệ sinh văn phòng",
        industrial: "Sau xây dựng",
        sofa: "Giặt sofa & nệm thảm",
        ac: "Vệ sinh máy lạnh",
        glass: "Vệ sinh kính",
      };

      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          category: newServiceCategory,
          categoryName: categoryNames[newServiceCategory] || "Vệ sinh nhà ở",
          price: parseInt(newServicePrice, 10),
          unit: newServiceUnit,
          sellerId: viewMode === "SELLER" ? selectedSellerId : 2,
          sellerName:
            selectedSellerId === 2
              ? "Công ty TNHH CleanPro"
              : selectedSellerId === 3
              ? "Dịch vụ Vệ sinh Sài Gòn Xanh"
              : "CleanPlus Việt Nam",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Thêm dịch vụ mới thành công!");
        setShowAddServiceModal(false);
        setNewServiceName("");
        setNewServicePrice("");
        fetchServices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Xuất báo cáo Excel / CSV giả lập
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
    link.setAttribute("download", `Bao_cao_CleanMate_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file báo cáo thống kê CSV!");
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER CHÍNH */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Tiêu đề quản trị */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Clean<span className="text-blue-600">Mate</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 tracking-wider">
                {viewMode === "ADMIN" ? "Quản Trị Sàn" : "Kênh Người Bán"}
              </span>
              <span className="text-xs text-slate-400 font-medium">v1.2.0</span>
            </div>
          </div>

          {/* Công tắc chuyển đổi Chế độ Quản trị Sàn (Admin) <-> Kênh Người Bán (Seller) */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => {
                  startTransition(() => setViewMode("ADMIN"));
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "ADMIN"
                    ? "bg-white text-blue-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Toàn sàn (Admin)</span>
              </button>
              <button
                onClick={() => {
                  startTransition(() => setViewMode("SELLER"));
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "SELLER"
                    ? "bg-white text-blue-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Kênh Người Bán</span>
              </button>
            </div>

            {/* Nếu đang ở Kênh Người Bán: Dropdown chọn doanh nghiệp đối tác */}
            {viewMode === "SELLER" && (
              <div className="relative">
                <select
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-xl shadow-xs text-slate-800 outline-none cursor-pointer focus:border-blue-500"
                >
                  <option value={2}>CleanPro (id: 2)</option>
                  <option value={3}>Sài Gòn Xanh (id: 3)</option>
                  <option value={4}>CleanPlus (id: 4)</option>
                </select>
              </div>
            )}

            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Về trang chủ</span>
            </Link>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto text-sm font-medium border-t border-slate-100">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 py-3 border-b-2 transition cursor-pointer ${
              activeTab === "analytics"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống kê & Biểu đồ</span>
          </button>

          {viewMode === "ADMIN" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 py-3 border-b-2 transition cursor-pointer ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản lý Người dùng</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 py-3 border-b-2 transition cursor-pointer ${
              activeTab === "services"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{viewMode === "ADMIN" ? "Quản lý Dịch vụ" : "Dịch vụ của tôi"}</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 py-3 border-b-2 transition cursor-pointer ${
              activeTab === "bookings"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{viewMode === "ADMIN" ? "Quản lý Đơn hàng" : "Đơn hàng nhận việc"}</span>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className={`flex items-center gap-2 py-3 border-b-2 transition cursor-pointer ${
              activeTab === "finance"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{viewMode === "ADMIN" ? "Tài chính & Hoa hồng" : "Ví & Rút tiền"}</span>
          </button>
        </div>
      </header>

      {/* 3. NỘI DUNG CHÍNH (MAIN BODY) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================
            TAB 1: THỐNG KÊ BIỂU ĐỒ (ANALYTICS & CHARTS)
        ======================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Thanh điều khiển bộ lọc thời gian & Preset */}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Lọc thống kê</span>
                </button>
              </div>

              {/* Nút lọc nhanh (Presets) & Nút xuất báo cáo */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => {
                      setFromDate("2026-10-06");
                      setToDate("2026-10-12");
                    }}
                    className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition"
                  >
                    7 ngày
                  </button>
                  <button
                    onClick={() => {
                      setFromDate("2026-09-29");
                      setToDate("2026-10-12");
                    }}
                    className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition"
                  >
                    14 ngày
                  </button>
                  <button
                    onClick={() => {
                      setFromDate("2026-09-12");
                      setToDate("2026-10-12");
                    }}
                    className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition"
                  >
                    30 ngày
                  </button>
                </div>

                <button
                  onClick={handleExportData}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Xuất CSV</span>
                </button>
              </div>
            </div>

            {/* Hàng 4 Thẻ KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Thẻ 1: Doanh thu */}
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
                    viewMode === "ADMIN"
                      ? kpiData.totalRevenue
                      : kpiData.totalGrossRevenue
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% so với kỳ trước</span>
                </div>
              </div>

              {/* Thẻ 2: Phí Hoa Hồng Sàn / Thực Nhận */}
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
                    viewMode === "ADMIN"
                      ? kpiData.platformFee
                      : kpiData.totalNetEarnings
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {viewMode === "ADMIN" ? "Doanh thu sàn thu về" : "Sau khi trích chiết khấu"}
                </div>
              </div>

              {/* Thẻ 3: Tổng số đơn hàng */}
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
                    {kpiData.completedRate || 95}%
                  </span>
                </div>
              </div>

              {/* Thẻ 4: Số dư ví / Khách hàng */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {viewMode === "ADMIN" ? "Tổng Đối Tác / User" : "Số Dư Ví Khả Dụng"}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    {viewMode === "ADMIN" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {viewMode === "ADMIN"
                    ? `${kpiData.totalSellers || 3} đối tác`
                    : formatVND(kpiData.walletBalance || 12450000)}
                </div>
                <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-1">
                  {viewMode === "ADMIN" ? (
                    <span>{kpiData.totalUsers || 8} tài khoản hoạt động</span>
                  ) : (
                    <span>Sẵn sàng rút về tài khoản</span>
                  )}
                </div>
              </div>
            </div>

            {/* KHỐI 1: BIỂU ĐỒ CỘT THỐNG KÊ THEO KHOẢNG THỜI GIAN */}
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
                    Dữ liệu hiển thị chi tiết từ ngày{" "}
                    <span className="font-semibold text-slate-700">{fromDate}</span> đến ngày{" "}
                    <span className="font-semibold text-slate-700">{toDate}</span>
                  </p>
                </div>

                {/* Chuyển đổi xem theo Doanh thu hoặc Số đơn */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setMetricType("revenue")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      metricType === "revenue"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Doanh thu (VND)
                  </button>
                  <button
                    onClick={() => setMetricType("orders")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      metricType === "orders"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Số đơn hàng
                  </button>
                </div>
              </div>

              {/* Vẽ biểu đồ cột tương tác SVG */}
              <div className="pt-6">
                {loadingAnalytics ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Đang tải dữ liệu biểu đồ...
                  </div>
                ) : (
                  <InteractiveColumnChart
                    data={columnData}
                    metricType={metricType}
                  />
                )}
              </div>
            </div>

            {/* KHỐI 2: CÁC BIỂU ĐỒ TRÒN (DONUT / PIE CHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ tròn 1: Phân bổ trạng thái đơn */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Biểu Đồ Tròn: Trạng Thái Đơn Hàng
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tỷ lệ hoàn thành, đang thực hiện và hủy đơn
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                    Live Data
                  </span>
                </div>
                <InteractiveDonutChart
                  data={donutStatus}
                  centerLabel="Trạng thái"
                  valueFormatter="count"
                />
              </div>

              {/* Biểu đồ tròn 2: Phân bổ theo danh mục dịch vụ / Dịch vụ của shop */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {viewMode === "ADMIN"
                        ? "Biểu Đồ Tròn: Danh Mục Dịch Vụ"
                        : "Biểu Đồ Tròn: Gói Dịch Vụ Bán Chạy"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đóng góp doanh thu theo từng nhóm vệ sinh
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                    Doanh thu
                  </span>
                </div>
                <InteractiveDonutChart
                  data={donutCategory}
                  centerLabel="Danh mục"
                  valueFormatter="currency"
                />
              </div>
            </div>

            {/* Biểu đồ tròn 3 (Dành riêng cho Admin): Phương thức thanh toán */}
            {viewMode === "ADMIN" && donutPayment.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Biểu Đồ Tròn: Phương Thức Thanh Toán
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thống kê tỷ trọng thanh toán không tiền mặt (VNPAY, MoMo, QR) so với Tiền mặt
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700">
                    Thanh toán
                  </span>
                </div>
                <div className="max-w-xl mx-auto">
                  <InteractiveDonutChart
                    data={donutPayment}
                    centerLabel="Cổng TT"
                    valueFormatter="count"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: QUẢN LÝ NGƯỜI DÙNG & ĐỐI TÁC (USERS) - ADMIN
        ======================================================== */}
        {activeTab === "users" && viewMode === "ADMIN" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Quản Lý Người Dùng & Đối Tác
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách khách hàng, doanh nghiệp cung cấp dịch vụ và quản trị viên
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Thanh tìm kiếm */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm tên, SĐT, Email..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-52"
                  />
                </div>

                {/* Lọc theo Role */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-1.5 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="SELLER">Người bán / Đối tác</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
            </div>

            {/* Bảng danh sách người dùng */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Họ & Tên</th>
                    <th className="px-6 py-3.5">Số điện thoại</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Vai trò</th>
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
                              : user.role === "SELLER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role === "ADMIN"
                            ? "Quản trị viên"
                            : user.role === "SELLER"
                            ? "Đối tác dịch vụ"
                            : "Khách hàng"}
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
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              user.status === "ACTIVE"
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {user.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: QUẢN LÝ DỊCH VỤ (SERVICES) - ADMIN & SELLER
        ======================================================== */}
        {activeTab === "services" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewMode === "ADMIN" ? "Quản Lý Dịch Vụ Toàn Sàn" : "Dịch Vụ Của Đơn Vị"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm duyệt, quản lý giá niêm yết và trạng thái hiển thị của các gói dịch vụ
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={serviceStatusFilter}
                  onChange={(e) => setServiceStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-1.5 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt (Active)</option>
                  <option value="PENDING">Chờ duyệt (Pending)</option>
                  <option value="INACTIVE">Tạm ẩn</option>
                </select>

                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dịch vụ</span>
                </button>
              </div>
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
                        ★ {srv.rating > 0 ? srv.rating.toFixed(1) : "Mới"} ({srv.completedBookings} đơn)
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
                        <div className="flex items-center justify-end gap-2">
                          {viewMode === "ADMIN" && srv.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateServiceStatus(srv.id, "APPROVED")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleUpdateServiceStatus(srv.id, "REJECTED")}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {srv.status === "APPROVED" && (
                            <button
                              onClick={() => handleUpdateServiceStatus(srv.id, "INACTIVE")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition"
                            >
                              Ẩn đi
                            </button>
                          )}
                          {srv.status === "INACTIVE" && (
                            <button
                              onClick={() => handleUpdateServiceStatus(srv.id, "APPROVED")}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition"
                            >
                              Hiện lại
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
            TAB 4: QUẢN LÝ ĐƠN HÀNG (BOOKINGS & ORDERS)
        ======================================================== */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewMode === "ADMIN" ? "Quản Lý Đơn Đặt Dịch Vụ" : "Đơn Đặt Của Đơn Vị"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi tiến độ dọn dẹp, nhân viên phụ trách và doanh thu thực nhận
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-1.5 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="IN_PROGRESS">Đang dọn dẹp</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
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
                        {booking.id}
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
                          {booking.status === "IN_PROGRESS" && <RefreshCw className="w-3 h-3 animate-spin" />}
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
                          {booking.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Nhận đơn
                            </button>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, "IN_PROGRESS")}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Bắt đầu dọn
                            </button>
                          )}
                          {booking.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, "COMPLETED")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Nghiệm thu
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
            TAB 5: TÀI CHÍNH & RÚT TIỀN (FINANCE & PAYOUT)
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
                      ? kpiData.platformFee || 45200000
                      : kpiData.walletBalance || 12450000
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
                    showToast("Đã gửi yêu cầu rút tiền 12.450.000đ tới ban quản trị sàn CleanMate!")
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

      {/* MODAL: THÊM DỊCH VỤ MỚI */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Thêm Dịch Vụ Vệ Sinh Mới
              </h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tên dịch vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ví dụ: Vệ sinh kính chung cư cao tầng"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nhóm danh mục
                </label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="home">Vệ sinh nhà ở</option>
                  <option value="office">Vệ sinh văn phòng</option>
                  <option value="industrial">Sau xây dựng</option>
                  <option value="sofa">Giặt sofa & nệm thảm</option>
                  <option value="ac">Vệ sinh máy lạnh</option>
                  <option value="glass">Vệ sinh kính</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceUnit}
                    onChange={(e) => setNewServiceUnit(e.target.value)}
                    placeholder="giờ, m², máy, căn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                >
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
