"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Inbox,
  Clock,
  Users,
  TrendingUp,
  HelpCircle,
  LogOut,
  ChevronDown,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Loader2,
  Check,
  X,
  ExternalLink,
  Shield,
  Eye,
  Camera,
  Navigation,
  ArrowLeft,
  UploadCloud,
  ChevronRight,
  Layers,
  Calculator,
  PlusCircle,
  Tag,
  DollarSign,
  Maximize2,
} from "lucide-react";
import { formatDateVN, formatDateTimeVN } from "@/src/lib/date-utils";

interface PricingOption {
  id: string;
  title: string;
  sub: string;
  price: number;
  unit: string;
}

interface CleanerTask {
  id: number;
  bookingCode: string;
  scheduledDate: string;
  address: string;
  note: string | null;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  customer: {
    id: number;
    fullName: string | null;
    phone: string | null;
    email: string | null;
  };
  service: {
    id: number;
    title: string;
    image: string;
    shopName: string;
    priceStart: number;
    pricingTable: PricingOption[];
  };
  payment: {
    status: string;
    amount: number;
    tipAmount: number;
    method: string;
  } | null;
  beforeImages?: string[];
  afterImages?: string[];
  createdAt: string;
}

interface Stats {
  totalAssigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalIncome: number;
}

export default function CleanerPortalPage() {
  const router = useRouter();

  const [activeSidebar, setActiveSidebar] = useState<"list" | "progress" | "history">("list");
  
  const [currentTab, setCurrentTab] = useState<"NEW" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED">("NEW");
  const [tasks, setTasks] = useState<CleanerTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Xem chi tiết một đơn cụ thể
  const [selectedTask, setSelectedTask] = useState<CleanerTask | null>(null);

  // States trong form cập nhật tiến độ trực tuyến
  const [nextStepStatus, setNextStepStatus] = useState<string>("COMPLETED");
  const [reportNote, setReportNote] = useState("");
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // CÁC STATES ĐIỀU CHỈNH GÓI & TÍNH LẠI GIÁ (DIỆN TÍCH M2, SỐ GIỜ, OPTION PHỤ)
  const [selectedPricingOptionId, setSelectedPricingOptionId] = useState<string>("");
  const [pricingUnitType, setPricingUnitType] = useState<"sqm" | "hour" | "fixed">("sqm");
  const [workAreaSqm, setWorkAreaSqm] = useState<number>(50); // Số m2
  const [workHours, setWorkHours] = useState<number>(3); // Số giờ
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0); // Phụ phí phát sinh
  const [surchargeReason, setSurchargeReason] = useState<string>(""); // Lý do phụ phí
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0); // Tổng giá tính lại
  const [isPriceCustomized, setIsPriceCustomized] = useState<boolean>(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<{
    id: number;
    fullName: string | null;
    email: string | null;
    role: string;
    image: string | null;
  } | null>(null);

  const [areaFilter, setAreaFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Kiểm tra xác thực
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.authenticated || !data.user) {
          router.replace("/login");
          return;
        }
        if (data.user.role !== "CLEANER" && data.user.role !== "STAFF" && data.user.role !== "ADMIN") {
          router.replace("/profile");
          return;
        }
        setUserProfile(data.user);
      } catch (err) {
        console.error("Lỗi xác thực:", err);
        router.replace("/login");
      }
    }
    checkAuth();
  }, [router]);

  // 2. Tải danh sách đơn đặt lịch
  const fetchTasks = async (selectUpdatedId?: number) => {
    try {
      setLoading(true);
      const res = await fetch("/api/cleaner/tasks?filter=ALL");
      const data = await res.json();
      if (data.success) {
        const fetchedList: CleanerTask[] = data.tasks || [];
        setTasks(fetchedList);
        setStats(data.stats || null);

        if (selectUpdatedId) {
          const found = fetchedList.find((t) => t.id === selectUpdatedId);
          if (found) {
            setSelectedTask(found);
            initDetailForm(found);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi tải đơn cleaner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchTasks();
    }
  }, [userProfile]);

  // Khởi tạo form khi chọn đơn xem chi tiết
  const initDetailForm = (task: CleanerTask) => {
    setSelectedTask(task);
    setReportNote(task.note || "");
    setBeforeImages(task.beforeImages || []);
    setAfterImages(task.afterImages || []);
    setCalculatedPrice(task.totalPrice);
    setIsPriceCustomized(false);
    setSurchargeAmount(0);
    setSurchargeReason("");

    // Khởi tạo gói option tương ứng dịch vụ
    const options = task.service.pricingTable || [];
    if (options.length > 0) {
      setSelectedPricingOptionId(options[0].id);
      if (options[0].unit.includes("m²") || options[0].unit.includes("m2")) {
        setPricingUnitType("sqm");
      } else if (options[0].unit.includes("giờ") || options[0].unit.includes("h")) {
        setPricingUnitType("hour");
      } else {
        setPricingUnitType("fixed");
      }
    } else {
      setSelectedPricingOptionId("");
      setPricingUnitType("sqm");
    }

    if (task.status === "PENDING") {
      setNextStepStatus("CONFIRMED");
    } else if (task.status === "CONFIRMED") {
      setNextStepStatus("IN_PROGRESS");
    } else {
      setNextStepStatus("COMPLETED");
    }
  };

  // Tự động tính toán lại đơn giá khi thay đổi option, số m2, số giờ, hoặc phụ phí
  useEffect(() => {
    if (!selectedTask) return;
    const options = selectedTask.service.pricingTable || [];
    const activeOpt = options.find((p) => p.id === selectedPricingOptionId) || options[0];

    const base = selectedTask.service.priceStart || 150000;
    let computed = 0;

    if (activeOpt) {
      if (activeOpt.unit.includes("m²") || activeOpt.unit.includes("m2") || pricingUnitType === "sqm") {
        computed = activeOpt.price * Number(workAreaSqm || 1);
      } else if (activeOpt.unit.includes("giờ") || activeOpt.unit.includes("h") || pricingUnitType === "hour") {
        computed = activeOpt.price * Number(workHours || 1);
      } else {
        computed = activeOpt.price;
      }
    } else {
      if (pricingUnitType === "sqm") {
        computed = 15000 * Number(workAreaSqm || 1);
      } else if (pricingUnitType === "hour") {
        computed = 120000 * Number(workHours || 1);
      } else {
        computed = base;
      }
    }

    // Cộng thêm phụ phí yêu cầu phát sinh
    const finalTotal = Math.max(0, computed + Number(surchargeAmount || 0));
    setCalculatedPrice(finalTotal);
  }, [selectedPricingOptionId, pricingUnitType, workAreaSqm, workHours, surchargeAmount, selectedTask]);

  const handleOpenDetail = (task: CleanerTask) => {
    initDetailForm(task);
    setActiveSidebar("progress");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cập nhật tiến trình, ghi chú, ảnh và giá điều chỉnh
  const handleSubmitProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setIsUpdatingProgress(true);

      // Nếu có điều chỉnh thêm gói/diện tích/phụ phí thì nối thêm vào ghi chú để cả khách hàng và sàn nắm rõ
      let finalNote = reportNote.trim();
      if (isPriceCustomized) {
        const optionInfo = selectedTask.service.pricingTable?.find((p) => p.id === selectedPricingOptionId)?.title || "Theo thỏa thuận thực tế";
        const customDetail = `[ĐIỀU CHỈNH GIÁ THỰC TẾ]: Gói: ${optionInfo} | Đơn vị: ${
          pricingUnitType === "sqm" ? `${workAreaSqm} m²` : pricingUnitType === "hour" ? `${workHours} giờ` : "Trọn gói"
        }${surchargeAmount > 0 ? ` | Phụ phí: +${surchargeAmount.toLocaleString()}đ (${surchargeReason || "Yêu cầu thêm"})` : ""} | Giá mới: ${calculatedPrice.toLocaleString()}đ.`;
        
        finalNote = finalNote ? `${finalNote}\n${customDetail}` : customDetail;
      }

      const res = await fetch("/api/cleaner/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedTask.id,
          status: nextStepStatus,
          note: finalNote,
          beforeImages,
          afterImages,
          totalPrice: isPriceCustomized ? calculatedPrice : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          isPriceCustomized
            ? "Đã tính lại giá và cập nhật tiến trình thành công!"
            : "Cập nhật tiến trình & Gửi thông báo thành công!",
          "success"
        );
        await fetchTasks(selectedTask.id);
      } else {
        showToast(data.message || "Không thể cập nhật tiến độ", "error");
      }
    } catch {
      showToast("Lỗi kết nối khi cập nhật tiến độ", "error");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Đăng xuất
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  // Lọc dữ liệu theo tab và tìm kiếm
  const filteredTasks = tasks.filter((t) => {
    if (currentTab === "NEW") {
      if (t.status !== "PENDING") return false;
    } else if (currentTab === "ACCEPTED") {
      if (t.status !== "CONFIRMED") return false;
    } else if (currentTab === "IN_PROGRESS") {
      if (t.status !== "IN_PROGRESS") return false;
    } else if (currentTab === "COMPLETED") {
      if (t.status !== "COMPLETED") return false;
    }

    if (areaFilter !== "all") {
      if (!t.address.toLowerCase().includes(areaFilter.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = t.bookingCode.toLowerCase().includes(q);
      const matchTitle = t.service.title.toLowerCase().includes(q);
      const matchCust = t.customer.fullName?.toLowerCase().includes(q);
      const matchAddr = t.address.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCust && !matchAddr) return false;
    }

    return true;
  });

  const countNew = tasks.filter((t) => t.status === "PENDING").length;
  const countAccepted = tasks.filter((t) => t.status === "CONFIRMED").length;
  const countInProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const countCompleted = tasks.filter((t) => t.status === "COMPLETED").length;

  const getTimelineStep = (status: string) => {
    switch (status) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
        return 2;
      case "IN_PROGRESS":
        return 4;
      case "COMPLETED":
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. TOP NAVBAR HEADER TRÊN CÙNG CHUẨN GIAO DIỆN MẪU */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Clean<span className="text-blue-600">Mate</span>
              </span>
            </Link>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Đối tác • Cleaner
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">
              Trang chủ
            </Link>
            <Link href="/dichvu" className="text-blue-600">
              Dịch vụ cung cấp
            </Link>
            <Link href="/profile?tab=support" className="hover:text-blue-600 transition">
              Trung tâm hỗ trợ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden border-2 border-white shadow-xs">
                {userProfile?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userProfile.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userProfile?.fullName?.charAt(0) || "C"
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {userProfile?.fullName || "Công ty TNHH Vệ sinh Sạch Bóng"}
                </div>
                <div className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">
                  Chuyên viên Vệ sinh
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toastMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 2. BODY CHÍNH */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: MENU SIDEBAR THEO ĐÚNG HÌNH MẪU (3 CỘT) */}
          <aside className="lg:col-span-3 space-y-2 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
            <Link
              href="/profile"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Tổng quan</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setActiveSidebar("list");
                setCurrentTab("NEW");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSidebar === "list" && currentTab === "NEW"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4 text-blue-600" />
                <span>Nhận đơn</span>
              </div>
              {countNew > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                  {countNew}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedTask) {
                  setActiveSidebar("progress");
                } else if (tasks.length > 0) {
                  const inProgressOne = tasks.find((t) => t.status === "IN_PROGRESS") || tasks[0];
                  initDetailForm(inProgressOne);
                  setActiveSidebar("progress");
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSidebar === "progress"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Tiến độ công việc</span>
              </div>
              {countInProgress > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {countInProgress}
                </span>
              )}
            </button>

            <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 select-none">
              <Users className="w-4 h-4 text-slate-300" />
              <span>Nhân viên nội bộ</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveSidebar("list");
                setCurrentTab("COMPLETED");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeSidebar === "list" && currentTab === "COMPLETED"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Báo cáo doanh thu</span>
              </div>
              {countCompleted > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {countCompleted}
                </span>
              )}
            </button>

            <Link
              href="/profile?tab=support"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Hỗ trợ & khiếu nại</span>
            </Link>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH (9 CỘT) */}
          <section className="lg:col-span-9 space-y-6">
            {/* ============================================================== */}
            {/* GIAO DIỆN A: CHI TIẾT CÔNG VIỆC & BÁO CÁO TIẾN ĐỘ + ĐIỀU CHỈNH OPTION/GIÁ */}
            {/* ============================================================== */}
            {activeSidebar === "progress" && selectedTask ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header chi tiết đơn hàng */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveSidebar("list")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline mb-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại danh sách đơn hàng</span>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Chi tiết công việc & Báo cáo tiến độ
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Đơn hàng: #{selectedTask.bookingCode} •{" "}
                      {selectedTask.status === "COMPLETED"
                        ? "Đã hoàn thành bàn giao"
                        : selectedTask.status === "IN_PROGRESS"
                        ? "Đang tiến hành dọn dẹp thực tế"
                        : selectedTask.status === "CONFIRMED"
                        ? "Đang di chuyển đến điểm dọn"
                        : "Chờ xác nhận bắt đầu"}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                        selectedTask.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : selectedTask.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {selectedTask.status === "COMPLETED"
                        ? "Hoàn tất & bàn giao"
                        : selectedTask.status === "IN_PROGRESS"
                        ? "Đang dọn dẹp tại nhà khách"
                        : selectedTask.status === "CONFIRMED"
                        ? "Đang di chuyển"
                        : "Chờ nhận đơn"}
                    </span>
                  </div>
                </div>

                {/* KHỐI 1: THẺ THÔNG TIN ĐƠN HÀNG, ĐỊA CHỈ, THỜI GIAN VÀ CÁC GÓI DỊCH VỤ */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{selectedTask.service.title}</h3>
                        <p className="text-xs text-blue-600 font-semibold">🏢 {selectedTask.service.shopName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Thanh toán nhận:</div>
                      <div className="text-xl font-black text-blue-600">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                          isPriceCustomized ? calculatedPrice : selectedTask.totalPrice
                        )}
                      </div>
                      {isPriceCustomized && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Đã tính lại theo thực tế
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Khách hàng liên hệ
                      </div>
                      <div className="font-bold text-slate-900">{selectedTask.customer.fullName || "Khách hàng"}</div>
                      <div className="font-mono text-slate-600">{selectedTask.customer.phone || "---"}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Thời gian thực hiện
                      </div>
                      <div className="font-bold text-slate-900">{formatDateVN(selectedTask.scheduledDate)}</div>
                      <div className="text-slate-500">Giờ hẹn: 08:00 - 17:00</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Địa điểm làm việc
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-2">{selectedTask.address}</div>
                    </div>
                  </div>

                  {selectedTask.note && (
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/50 text-xs text-amber-900 whitespace-pre-line">
                      <strong>Ghi chú:</strong> {selectedTask.note}
                    </div>
                  )}
                </div>

                {/* KHỐI 2: ĐIỀU CHỈNH GÓI & TÍNH LẠI GIÁ (DIỆN TÍCH M2, SỐ GIỜ, OPTION PHÁT SINH) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Calculator className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          Điều Chỉnh Diện Tích, Số Giờ & Tính Lại Giá (Theo yêu cầu chủ nhà)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Áp dụng khi khách yêu cầu dọn thêm phòng, tăng m², tăng giờ làm việc hoặc thêm dịch vụ
                        </p>
                      </div>
                    </div>

                    {/* Switch bật/tắt tính lại giá */}
                    <button
                      type="button"
                      onClick={() => setIsPriceCustomized(!isPriceCustomized)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isPriceCustomized
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isPriceCustomized ? "Đang áp dụng giá mới" : "Chỉnh sửa diện tích / option"}</span>
                    </button>
                  </div>

                  {isPriceCustomized && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-200 text-xs">
                      {/* Chọn gói dịch vụ có sẵn của shop */}
                      {selectedTask.service.pricingTable && selectedTask.service.pricingTable.length > 0 && (
                        <div>
                          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                            1. Chọn gói option dịch vụ:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {selectedTask.service.pricingTable.map((opt) => (
                              <div
                                key={opt.id}
                                onClick={() => {
                                  setSelectedPricingOptionId(opt.id);
                                  if (opt.unit.includes("m²") || opt.unit.includes("m2")) {
                                    setPricingUnitType("sqm");
                                  } else if (opt.unit.includes("giờ") || opt.unit.includes("h")) {
                                    setPricingUnitType("hour");
                                  } else {
                                    setPricingUnitType("fixed");
                                  }
                                }}
                                className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                                  selectedPricingOptionId === opt.id
                                    ? "bg-blue-50/80 border-blue-500 shadow-2xs"
                                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-bold text-slate-900">{opt.title}</div>
                                <div className="text-[11px] text-slate-500">{opt.sub}</div>
                                <div className="font-extrabold text-blue-600 mt-1">
                                  {opt.price.toLocaleString()}đ {opt.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chọn cách tính và nhập số lượng (m2 hoặc giờ) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {/* Hình thức tính */}
                        <div>
                          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            2. Cách tính phí:
                          </label>
                          <select
                            value={pricingUnitType}
                            onChange={(e) => setPricingUnitType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-medium"
                          >
                            <option value="sqm">Theo diện tích (m²)</option>
                            <option value="hour">Theo số giờ làm việc (Giờ)</option>
                            <option value="fixed">Gói cố định / Theo căn</option>
                          </select>
                        </div>

                        {/* Nhập số m2 hoặc số giờ */}
                        {pricingUnitType === "sqm" && (
                          <div>
                            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Diện tích thực tế (m²):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={workAreaSqm}
                                onChange={(e) => setWorkAreaSqm(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-bold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">m²</span>
                            </div>
                          </div>
                        )}

                        {pricingUnitType === "hour" && (
                          <div>
                            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Thời lượng làm việc (Giờ):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="24"
                                step="0.5"
                                value={workHours}
                                onChange={(e) => setWorkHours(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-bold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">giờ</span>
                            </div>
                          </div>
                        )}

                        {/* Phụ phí yêu cầu thêm nếu có */}
                        <div>
                          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Phụ phí phát sinh (+VNĐ):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={surchargeAmount}
                            onChange={(e) => setSurchargeAmount(Number(e.target.value))}
                            placeholder="0 đ"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-bold"
                          />
                        </div>
                      </div>

                      {/* Lý do phụ phí nếu có */}
                      {surchargeAmount > 0 && (
                        <div>
                          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Lý do phát sinh phụ phí:
                          </label>
                          <input
                            type="text"
                            value={surchargeReason}
                            onChange={(e) => setSurchargeReason(e.target.value)}
                            placeholder="Ví dụ: Giặt thêm thảm phòng khách, tẩy ố dầu mỡ nặng lò vi sóng..."
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}

                      {/* Box tổng kết số tiền tính lại */}
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800">Tổng thanh toán sau khi điều chỉnh:</div>
                          <div className="text-[11px] text-slate-500">
                            Giá gốc ban đầu: {selectedTask.totalPrice.toLocaleString()}đ •{" "}
                            {pricingUnitType === "sqm"
                              ? `Tính theo ${workAreaSqm} m²`
                              : pricingUnitType === "hour"
                              ? `Tính theo ${workHours} giờ`
                              : "Gói cố định"}
                            {surchargeAmount > 0 ? ` (+${surchargeAmount.toLocaleString()}đ phụ phí)` : ""}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-indigo-700">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(calculatedPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KHỐI 3: TIẾN TRÌNH THỰC HIỆN DỌN DẸP (STEPPER THEO ĐÚNG HÌNH ẢNH MẪU) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">Tiến trình thực hiện dọn dẹp</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center text-center">
                    <div className="flex flex-col items-center relative">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-2">Đã nhận đơn</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">09:00, 15/11</div>
                    </div>

                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${
                          getTimelineStep(selectedTask.status) >= 2
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {getTimelineStep(selectedTask.status) >= 2 ? <Check className="w-4 h-4" /> : "2"}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-2">Đang di chuyển</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">09:15, 15/11</div>
                    </div>

                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${
                          getTimelineStep(selectedTask.status) >= 3
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {getTimelineStep(selectedTask.status) >= 3 ? <Check className="w-4 h-4" /> : "3"}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-2">Bắt đầu dọn dẹp</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">09:30, 15/11</div>
                    </div>

                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${
                          getTimelineStep(selectedTask.status) >= 4
                            ? "bg-blue-600 text-white animate-pulse"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {getTimelineStep(selectedTask.status) >= 5 ? <Check className="w-4 h-4" /> : "4"}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-2">Đang tiến hành</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Thời gian thực tế</div>
                    </div>

                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${
                          getTimelineStep(selectedTask.status) >= 5
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {getTimelineStep(selectedTask.status) >= 5 ? <Check className="w-4 h-4" /> : "5"}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-2">Hoàn tất & bàn giao</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {selectedTask.status === "COMPLETED" ? "Đã xác nhận" : "Chờ báo cáo"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KHỐI 4 & 5: 2 CỘT CHUẨN FORM TRONG HÌNH ẢNH MẪU */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* CỘT TRÁI: FORM CẬP NHẬT TRẠNG THÁI TRỰC TUYẾN */}
                  <form
                    onSubmit={handleSubmitProgressUpdate}
                    className="md:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-4 text-xs"
                  >
                    <h3 className="font-bold text-sm text-slate-900">Cập nhật trạng thái trực tuyến</h3>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Chọn trạng thái công việc kế tiếp <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={nextStepStatus}
                        onChange={(e) => setNextStepStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 font-medium cursor-pointer"
                      >
                        <option value="CONFIRMED">Đang di chuyển đến điểm dọn dẹp</option>
                        <option value="IN_PROGRESS">Đang dọn dẹp tại nhà khách</option>
                        <option value="COMPLETED">Hoàn tất dọn dẹp và bàn giao nhà</option>
                        <option value="CANCELLED">Hủy ca dọn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Ghi chú cho khách hàng
                      </label>
                      <textarea
                        rows={3}
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Ví dụ: Đã dọn dẹp sạch sẽ bếp, lau kính mặt ngoài ban công."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-600 leading-relaxed text-xs"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProgress}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingProgress ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang cập nhật...</span>
                          </>
                        ) : (
                          <span>Cập nhật tiến trình & Gửi thông báo</span>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* CỘT PHẢI: ẢNH BÁO CÁO NGHIỆM THU DỌN DẸP */}
                  <div className="md:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-slate-900">Ảnh báo cáo nghiệm thu dọn dẹp</h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Box 1: Trước khi dọn dẹp */}
                      <div className="space-y-2">
                        <label className="block font-semibold text-slate-700 text-[11px]">
                          Trước khi dọn dẹp:
                        </label>
                        <div
                          onClick={() => {
                            const url = prompt(
                              "Nhập URL hình ảnh chụp hiện trạng TRƯỚC khi dọn dẹp:",
                              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
                            );
                            if (url && url.trim()) setBeforeImages([...beforeImages, url.trim()]);
                          }}
                          className="h-32 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition"
                        >
                          <FileText className="w-6 h-6 text-blue-600 mb-1.5" />
                          <span className="text-[11px] text-slate-600 font-medium">Bấm để tải ảnh lên</span>
                          {beforeImages.length > 0 && (
                            <span className="text-[10px] text-blue-600 font-bold mt-1">
                              ({beforeImages.length} ảnh đã thêm)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Box 2: Sau khi hoàn tất */}
                      <div className="space-y-2">
                        <label className="block font-semibold text-slate-700 text-[11px]">
                          Sau khi hoàn tất:
                        </label>
                        <div
                          onClick={() => {
                            const url = prompt(
                              "Nhập URL hình ảnh chụp kết quả SAU KHI hoàn tất:",
                              "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80"
                            );
                            if (url && url.trim()) setAfterImages([...afterImages, url.trim()]);
                          }}
                          className="h-32 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition"
                        >
                          <FileText className="w-6 h-6 text-blue-600 mb-1.5" />
                          <span className="text-[11px] text-slate-600 font-medium">Bấm để tải ảnh lên</span>
                          {afterImages.length > 0 && (
                            <span className="text-[10px] text-emerald-600 font-bold mt-1">
                              ({afterImages.length} ảnh đã thêm)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Xem trước ảnh nếu có */}
                    {(beforeImages.length > 0 || afterImages.length > 0) && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto py-1">
                        {beforeImages.map((u, i) => (
                          <div key={`b-${i}`} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="Before" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center">Trước</span>
                          </div>
                        ))}
                        {afterImages.map((u, i) => (
                          <div key={`a-${i}`} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="After" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-[8px] text-center">Sau</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* GIAO DIỆN B: DANH SÁCH YÊU CẦU ĐẶT LỊCH (CHỈ CÓ NÚT XEM CHI TIẾT ĐƠN) */
              /* ============================================================== */
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Danh sách yêu cầu đặt lịch dọn dẹp
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Nhận các đơn vệ sinh mới trong khu vực của bạn hoặc theo dõi lịch trình đã cam kết thực hiện.
                  </p>
                </div>

                {/* HÀNG TAB CHỌN TRẠNG THÁI */}
                <div className="flex items-center gap-6 border-b border-slate-200 text-xs sm:text-sm font-semibold overflow-x-auto pb-px">
                  <button
                    type="button"
                    onClick={() => setCurrentTab("NEW")}
                    className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                      currentTab === "NEW"
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đơn hàng mới ({countNew})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab("ACCEPTED")}
                    className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                      currentTab === "ACCEPTED"
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đã nhận ({countAccepted})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab("IN_PROGRESS")}
                    className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                      currentTab === "IN_PROGRESS"
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đang thực hiện ({countInProgress})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTab("COMPLETED")}
                    className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                      currentTab === "COMPLETED"
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Hoàn thành ({countCompleted})
                  </button>
                </div>

                {/* BỘ LỌC KHU VỰC */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-500">Khu vực:</span>
                    <button
                      type="button"
                      onClick={() => setAreaFilter("all")}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        areaFilter === "all"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Tất cả khu vực
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaFilter("Quận 1")}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        areaFilter === "Quận 1"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Quận 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaFilter("Quận 2")}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        areaFilter === "Quận 2"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Quận 2 (Thủ Đức)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaFilter("Bình Thạnh")}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        areaFilter === "Bình Thạnh"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Bình Thạnh
                    </button>
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm mã đơn, tên khách..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* DANH SÁCH THẺ ĐƠN HÀNG - CHỈ CÓ NÚT XEM CHI TIẾT ĐƠN */}
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Đang đồng bộ dữ liệu ca dọn dẹp...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">Không có đơn đặt lịch nào trong danh mục này</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Hiện chưa có yêu cầu mới phù hợp với bộ lọc hiện tại.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all overflow-hidden"
                      >
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              Mã đơn hàng: #{task.bookingCode}
                            </span>
                            {task.status === "PENDING" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                Được yêu cầu riêng
                              </span>
                            )}
                            {task.status === "CONFIRMED" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                Đã nhận đơn
                              </span>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                                Đang tiến hành dọn dẹp
                              </span>
                            )}
                            {task.status === "COMPLETED" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Đã hoàn thành
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Cập nhật: {formatDateVN(task.createdAt)}
                          </div>
                        </div>

                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                              <FileText className="w-6 h-6" />
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {task.service.title}
                              </h3>

                              <div className="text-slate-600">
                                Khách hàng: <span className="font-semibold text-slate-800">{task.customer.fullName || "Khách hàng CleanMate"}</span>
                                {task.customer.phone && (
                                  <span className="ml-2 font-mono text-slate-500">({task.customer.phone})</span>
                                )}
                              </div>

                              <div className="text-slate-600 flex items-start gap-1">
                                <span className="text-rose-500 shrink-0">📍</span>
                                <span>Địa điểm: {task.address}</span>
                              </div>

                              <div className="text-slate-700 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>
                                  <strong>Thời gian dọn dẹp:</strong> {formatDateVN(task.scheduledDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left md:text-right shrink-0">
                            <div className="text-[11px] text-slate-400 font-medium">Thanh toán nhận:</div>
                            <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight mt-0.5">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(task.totalPrice)}
                            </div>
                          </div>
                        </div>

                        <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="text-slate-500 italic">
                            Hình thức dọn dẹp: Mang theo dụng cụ chuyên dụng tiêu chuẩn CleanMate
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(task)}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem chi tiết đơn</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 3. FOOTER XANH ĐEN THEO ĐÚNG HÌNH MẪU THIẾT KẾ */}
      <footer className="bg-[#1e293b] text-slate-300 text-xs mt-16 border-t border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Clean<span className="text-blue-500">Mate</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Nền tảng công nghệ kết nối khách hàng với các đối tác vệ sinh chuyên nghiệp, tận tâm hàng đầu tại Việt Nam. Mang lại không gian sống trong lành và an tâm tuyệt đối.
              </p>
              <div className="pt-2 text-slate-400 space-y-1">
                <div>Hotline dành cho Đối tác: <span className="text-white font-bold">1900 8199</span> (8:00 - 22:00)</div>
                <div>Email: hopdong@cleanmate.vn</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Chương trình</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Đào tạo tay nghề</a></li>
                <li><a href="#" className="hover:text-white transition">Quy chuẩn vệ sinh</a></li>
                <li><a href="#" className="hover:text-white transition">Ưu đãi thiết bị</a></li>
                <li><a href="#" className="hover:text-white transition">Khen thưởng tháng</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Pháp lý & An toàn</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Bảo hiểm dịch vụ</a></li>
                <li><a href="#" className="hover:text-white transition">Hợp đồng đối tác</a></li>
                <li><a href="#" className="hover:text-white transition">Quy trình xử phạt</a></li>
                <li><a href="#" className="hover:text-white transition">Giải quyết tranh chấp</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Hệ thống</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Bảng tin CleanMate</a></li>
                <li><a href="#" className="hover:text-white transition">Cộng đồng đối tác</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ văn phòng</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
            <div>
              © 2026 CleanMate Marketplace. Portal dành riêng cho Đối tác Vệ sinh.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition">Điều khoản dịch vụ đối tác</a>
              <a href="#" className="hover:text-white transition">Chính sách bảo mật thông tin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
