"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "./layout";
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Users,
  Building2,
  Filter,
  Download,
  Loader2,
} from "lucide-react";
import InteractiveColumnChart, {
  ColumnDataPoint,
} from "@/src/components/charts/InteractiveColumnChart";
import InteractiveDonutChart, {
  DonutItem,
} from "@/src/components/charts/InteractiveDonutChart";

export default function AdminAnalyticsPage() {
  const { viewMode, selectedSellerId, shopsList, showToast } = useAdmin();

  // Bộ lọc thời gian (mặc định 7 ngày gần nhất)
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 6);
  const [fromDate, setFromDate] = useState(defaultFromDate.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(todayStr);
  const [metricType, setMetricType] = useState<"revenue" | "orders">("revenue");

  // State dữ liệu biểu đồ & KPIs
  const [columnData, setColumnData] = useState<ColumnDataPoint[]>([]);
  const [donutStatus, setDonutStatus] = useState<DonutItem[]>([]);
  const [donutCategory, setDonutCategory] = useState<DonutItem[]>([]);
  const [kpiData, setKpiData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
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
        setKpiData(json.kpi || {});
      }
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchAnalytics();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, fromDate, toDate]);

  // Format tiền tệ VNĐ
  const formatVND = (amount: number | undefined) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

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
    showToast("Đã xuất file CSV báo cáo tài chính thành công!");
  };

  return (
    <div className="space-y-8">
      {/* 1. THANH ĐIỀU KHIỂN BỘ LỌC THỜI GIAN */}
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

        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất báo cáo CSV</span>
        </button>
      </div>

      {/* 2. HÀNG 4 THẺ KPI METRICS */}
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
            {formatVND(viewMode === "ADMIN" ? kpiData.totalRevenue : kpiData.totalGrossRevenue)}
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
            {formatVND(viewMode === "ADMIN" ? kpiData.platformFee : kpiData.totalNetEarnings)}
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
            {kpiData.totalOrders || 0} <span className="text-sm font-normal text-slate-400">đơn</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tỷ lệ hoàn thành:{" "}
            <span className="font-semibold text-slate-700">{kpiData.completedRate || 100}%</span>
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

      {/* 3. BIỂU ĐỒ CỘT THỜI GIAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Biểu Đồ Cột: Thống Kê Theo Thời Gian</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dữ liệu hiển thị từ ngày <span className="font-semibold text-slate-700">{fromDate}</span> đến ngày{" "}
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
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : columnData.length > 0 ? (
            <InteractiveColumnChart data={columnData} metricType={metricType} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Không có phát sinh đơn hàng trong khoảng ngày đã chọn
            </div>
          )}
        </div>
      </div>

      {/* 4. HÀNG 2 BIỂU ĐỒ TRÒN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tỷ Lệ Trạng Thái Đơn Hàng</h3>
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
  );
}
