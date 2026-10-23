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
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDateVN, formatDateTimeVN } from "@/src/lib/date-utils";

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

  const [currentTab, setCurrentTab] = useState<"NEW" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED">("NEW");
  const [tasks, setTasks] = useState<CleanerTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<{
    id: number;
    fullName: string | null;
    email: string | null;
    role: string;
    image: string | null;
  } | null>(null);

  // Bộ lọc khu vực (như trong design mẫu)
  const [areaFilter, setAreaFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // MODAL NGHIỆM THU CÔNG VIỆC VỚI GHI CHÚ VÀ HÌNH ẢNH SAU KHI DỌN
  const [completingTask, setCompletingTask] = useState<CleanerTask | null>(null);
  const [inspectionNote, setInspectionNote] = useState("");
  const [afterImagesList, setAfterImagesList] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  // MODAL XEM HÌNH ẢNH NGHIỆM THU
  const [viewingImagesTask, setViewingImagesTask] = useState<CleanerTask | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Kiểm tra xác thực & lấy thông tin user
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.authenticated || !data.user) {
          router.replace("/login");
          return;
        }

        // Kiểm tra quyền: CLEANER, STAFF hoặc ADMIN
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
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cleaner/tasks?filter=ALL");
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setStats(data.stats || null);
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

  // Xử lý cập nhật trạng thái đơn (Nhận lịch dọn dẹp, Từ chối, Bắt đầu làm)
  const handleUpdateStatus = async (taskId: number, newStatus: string, actionLabel: string) => {
    try {
      setActionLoadingId(taskId);
      const res = await fetch("/api/cleaner/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: taskId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Đã ${actionLabel} thành công!`, "success");
        await fetchTasks();
      } else {
        showToast(data.message || `Không thể ${actionLabel}`, "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mở modal nghiệm thu hoàn thành ca dọn
  const handleOpenCompleteModal = (task: CleanerTask) => {
    setCompletingTask(task);
    setInspectionNote(task.note || "Đã hoàn thành dọn dẹp theo đúng tiêu chuẩn. Khách hàng đã kiểm tra thực tế.");
    setAfterImagesList(
      task.afterImages && task.afterImages.length > 0
        ? task.afterImages
        : [
            "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
          ]
    );
    setNewImageUrl("");
  };

  // Thêm ảnh nghiệm thu vào danh sách
  const handleAddAfterImage = () => {
    if (!newImageUrl.trim()) return;
    setAfterImagesList([...afterImagesList, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  // Xóa ảnh nghiệm thu khỏi danh sách
  const handleRemoveAfterImage = (indexToRemove: number) => {
    setAfterImagesList(afterImagesList.filter((_, idx) => idx !== indexToRemove));
  };

  // Gửi Form Nghiệm Thu
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    try {
      setIsSubmittingInspection(true);
      const res = await fetch("/api/cleaner/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: completingTask.id,
          status: "COMPLETED",
          note: inspectionNote.trim(),
          afterImages: afterImagesList,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Đã gửi hồ sơ nghiệm thu và hoàn thành ca dọn!", "success");
        setCompletingTask(null);
        await fetchTasks();
      } else {
        showToast(data.message || "Không thể nộp nghiệm thu", "error");
      }
    } catch (err) {
      showToast("Lỗi gửi dữ liệu nghiệm thu", "error");
    } finally {
      setIsSubmittingInspection(false);
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
    // Lọc theo Tab
    if (currentTab === "NEW") {
      if (t.status !== "PENDING") return false;
    } else if (currentTab === "ACCEPTED") {
      if (t.status !== "CONFIRMED") return false;
    } else if (currentTab === "IN_PROGRESS") {
      if (t.status !== "IN_PROGRESS") return false;
    } else if (currentTab === "COMPLETED") {
      if (t.status !== "COMPLETED") return false;
    }

    // Lọc theo khu vực
    if (areaFilter !== "all") {
      if (!t.address.toLowerCase().includes(areaFilter.toLowerCase())) return false;
    }

    // Tìm kiếm
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. TOP NAVBAR HEADER TRÊN CÙNG CHUẨN GIAO DIỆN MẪU */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tag Đối tác */}
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

          {/* Menu Điều hướng giữa Navbar */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">
              Trang chủ sàn
            </Link>
            <Link href="/dichvu" className="text-blue-600">
              Dịch vụ cung cấp
            </Link>
            <Link href="/profile?tab=support" className="hover:text-blue-600 transition">
              Trung tâm hỗ trợ
            </Link>
          </nav>

          {/* User Profile dropdown bên phải */}
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
                  {userProfile?.fullName || "Nhân viên Dọn dẹp"}
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

      {/* 2. BODY CHÍNH GỒM SIDEBAR TRÁI VÀ NỘI DUNG PHẢI */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: MENU SIDEBAR THEO ĐÚNG HÌNH MẪU (3 CỘT) */}
          <aside className="lg:col-span-3 space-y-2 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
            {/* Mục 1: Tổng quan */}
            <Link
              href="/profile"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Hồ sơ cá nhân</span>
            </Link>

            {/* Mục 2: Nhận đơn (Active) */}
            <button
              type="button"
              onClick={() => setCurrentTab("NEW")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentTab === "NEW" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
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

            {/* Mục 3: Tiến độ công việc */}
            <button
              type="button"
              onClick={() => setCurrentTab("IN_PROGRESS")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === "IN_PROGRESS"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Tiến độ công việc</span>
              </div>
              {countInProgress > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {countInProgress}
                </span>
              )}
            </button>

            {/* Mục 4: Lịch làm việc */}
            <button
              type="button"
              onClick={() => setCurrentTab("ACCEPTED")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === "ACCEPTED"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Đã nhận & Sắp làm</span>
              </div>
              {countAccepted > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {countAccepted}
                </span>
              )}
            </button>

            {/* Mục 5: Báo cáo thu nhập */}
            <button
              type="button"
              onClick={() => setCurrentTab("COMPLETED")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentTab === "COMPLETED"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Báo cáo thu nhập</span>
              </div>
              {countCompleted > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {countCompleted}
                </span>
              )}
            </button>

            {/* Mục 6: Hỗ trợ & khiếu nại */}
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

          {/* CỘT PHẢI: KHU VỰC NỘI DUNG CHÍNH (9 CỘT) */}
          <section className="lg:col-span-9 space-y-6">
            {/* Tiêu đề trang */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Danh sách yêu cầu đặt lịch dọn dẹp
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Nhận các đơn vệ sinh mới trong khu vực của bạn hoặc theo dõi lịch trình đã cam kết thực hiện.
              </p>
            </div>

            {/* HÀNG TAB CHỌN TRẠNG THÁI (Đơn hàng mới, Đã nhận, Đang thực hiện, Hoàn thành) */}
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

            {/* BỘ LỌC KHU VỰC THEO MẪU ẢNH */}
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

              {/* Tìm kiếm nhanh */}
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

            {/* DANH SÁCH THẺ ĐƠN HÀNG (CLEAN CARD THEO ĐÚNG THIẾT KẾ MẪU) */}
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
                  Hiện chưa có yêu cầu mới phù hợp với bộ lọc hiện tại. Vui lòng thử chọn khu vực khác hoặc chờ thông báo đơn mới từ khách hàng.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all overflow-hidden"
                  >
                    {/* Header của thẻ đơn: Mã đơn hàng + Thời gian cập nhật */}
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
                            Đã xác nhận nhận ca
                          </span>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                            Đang tiến hành dọn dẹp
                          </span>
                        )}
                        {task.status === "COMPLETED" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Đã hoàn thành nghiệm thu
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Cập nhật: {formatDateVN(task.createdAt)}
                      </div>
                    </div>

                    {/* Thân thẻ đơn: Icon giấy tờ + Chi tiết công việc + Số tiền */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        {/* Icon file giấy tờ màu xanh nhạt như trong design */}
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText className="w-6 h-6" />
                        </div>

                        <div className="space-y-1.5 text-xs">
                          {/* Tên dịch vụ */}
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {task.service.title}
                          </h3>

                          {/* Khách hàng */}
                          <div className="text-slate-600">
                            Khách hàng: <span className="font-semibold text-slate-800">{task.customer.fullName || "Khách hàng CleanMate"}</span>
                            {task.customer.phone && (
                              <span className="ml-2 font-mono text-slate-500">({task.customer.phone})</span>
                            )}
                          </div>

                          {/* Địa điểm */}
                          <div className="text-slate-600 flex items-start gap-1">
                            <span className="text-rose-500 shrink-0">📍</span>
                            <span>Địa điểm: {task.address}</span>
                          </div>

                          {/* Thời gian dọn dẹp */}
                          <div className="text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              <strong>Thời gian dọn dẹp:</strong> {formatDateVN(task.scheduledDate)}
                            </span>
                          </div>

                          {task.note && (
                            <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50 mt-1">
                              📝 Ghi chú: {task.note}
                            </div>
                          )}

                          {/* Nếu đã có ảnh nghiệm thu */}
                          {task.afterImages && task.afterImages.length > 0 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setViewingImagesTask(task)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Xem {task.afterImages.length} ảnh sau khi dọn dẹp</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cột giá tiền thanh toán nhận */}
                      <div className="text-left md:text-right shrink-0">
                        <div className="text-[11px] text-slate-400 font-medium">Thanh toán nhận:</div>
                        <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight mt-0.5">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(task.totalPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Hình thức: {task.payment?.method || "Tiền mặt"} ({task.payment?.status === "COMPLETED" ? "Đã trả" : "Chưa trả"})
                        </div>
                      </div>
                    </div>

                    {/* Footer của thẻ đơn: Chú thích & Nút hành động chuẩn mẫu */}
                    <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500 italic">
                        Hình thức dọn dẹp: Mang theo dụng cụ chuyên dụng tiêu chuẩn CleanMate
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* TRẠNG THÁI PENDING: Nút Từ chối đơn & Nhận lịch dọn dẹp */}
                        {task.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === task.id}
                              onClick={() => handleUpdateStatus(task.id, "CANCELLED", "từ chối đơn")}
                              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              Từ chối đơn
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === task.id}
                              onClick={() => handleUpdateStatus(task.id, "CONFIRMED", "nhận lịch")}
                              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : null}
                              <span>Nhận lịch dọn dẹp</span>
                            </button>
                          </>
                        )}

                        {/* TRẠNG THÁI CONFIRMED: Bắt đầu di chuyển & dọn dẹp */}
                        {task.status === "CONFIRMED" && (
                          <>
                            {task.customer.phone && (
                              <a
                                href={`tel:${task.customer.phone}`}
                                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                <span>Gọi khách</span>
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={actionLoadingId === task.id}
                              onClick={() => handleUpdateStatus(task.id, "IN_PROGRESS", "bắt đầu ca")}
                              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Navigation className="w-3.5 h-3.5" />
                              )}
                              <span>Bắt đầu đến & Dọn dẹp</span>
                            </button>
                          </>
                        )}

                        {/* TRẠNG THÁI IN_PROGRESS: Mở Form Nghiệm thu dọn dẹp (ghi chú + ảnh) */}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(task)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Nghiệm thu & Hoàn thành ca dọn</span>
                          </button>
                        )}

                        {/* TRẠNG THÁI COMPLETED: Đã hoàn tất */}
                        {task.status === "COMPLETED" && (
                          <div className="flex items-center gap-2">
                            {task.afterImages && task.afterImages.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingImagesTask(task)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                <span>Xem ảnh</span>
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã hoàn tất</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODAL FORM NGHIỆM THU HOÀN THÀNH (ĐIỀN GHI CHÚ VÀ HÌNH ẢNH SAU KHI DỌN DẸP) */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Nghiệm Thu Ca Dọn Dẹp</h3>
                  <p className="text-[11px] text-slate-500">Mã đơn: #{completingTask.bookingCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              {/* Thông tin nhanh đơn hàng */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">{completingTask.service.title}</div>
                <div className="text-slate-500">Khách hàng: {completingTask.customer.fullName} • Địa chỉ: {completingTask.address}</div>
              </div>

              {/* Ghi chú sau khi dọn dẹp */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú kết quả nghiệm thu <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={inspectionNote}
                  onChange={(e) => setInspectionNote(e.target.value)}
                  placeholder="Mô tả kết quả công việc, khu vực đã xử lý sạch sẽ, phản hồi của khách hàng..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Hình ảnh sau khi dọn dẹp */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hình ảnh sau khi dọn dẹp (After Images)
                </label>
                
                {/* Input thêm URL ảnh */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Dán đường link ảnh sau khi làm sạch (https://...)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAfterImage}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ảnh</span>
                  </button>
                </div>

                {/* Danh sách ảnh hiện tại */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {afterImagesList.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAfterImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                        Ảnh {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hành động Modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  disabled={isSubmittingInspection}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInspection}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingInspection ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận hoàn tất ca dọn</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM HÌNH ẢNH NGHIỆM THU */}
      {viewingImagesTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>Hình ảnh nghiệm thu công trình #{viewingImagesTask.bookingCode}</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingImagesTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong>Ghi chú:</strong> {viewingImagesTask.note || "Đã hoàn tất theo tiêu chuẩn CleanMate"}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {viewingImagesTask.afterImages?.map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Inspection ${idx + 1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setViewingImagesTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOOTER XANH ĐEN THEO ĐÚNG HÌNH MẪU THIẾT KẾ */}
      <footer className="bg-[#1e293b] text-slate-300 text-xs mt-16 border-t border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Cột 1: Thông tin thương hiệu */}
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

            {/* Cột 2: Chương trình */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Chương trình</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Đào tạo tay nghề</a></li>
                <li><a href="#" className="hover:text-white transition">Quy chuẩn vệ sinh</a></li>
                <li><a href="#" className="hover:text-white transition">Ưu đãi thiết bị</a></li>
                <li><a href="#" className="hover:text-white transition">Khen thưởng tháng</a></li>
              </ul>
            </div>

            {/* Cột 3: Pháp lý & An toàn */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Pháp lý & An toàn</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Bảo hiểm dịch vụ</a></li>
                <li><a href="#" className="hover:text-white transition">Hợp đồng đối tác</a></li>
                <li><a href="#" className="hover:text-white transition">Quy trình xử phạt</a></li>
                <li><a href="#" className="hover:text-white transition">Giải quyết tranh chấp</a></li>
              </ul>
            </div>

            {/* Cột 4: Hệ thống */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Hệ thống</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Bảng tin CleanMate</a></li>
                <li><a href="#" className="hover:text-white transition">Cộng đồng đối tác</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ văn phòng</a></li>
              </ul>
            </div>
          </div>

          {/* Dòng bản quyền dưới cùng */}
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
