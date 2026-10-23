"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import {
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Info,
  Trash2,
  Edit,
  Settings2,
} from "lucide-react";

interface AddressItem {
  id: number;
  receiverName: string;
  phone: string;
  detailAddress: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  isDefault: boolean;
}

interface CartItemData {
  id: number | string;
  serviceId: number;
  title: string;
  priceStart: number;
  image: string;
  shopName: string;
  quantity: number;
  scheduledDate?: string;
  note?: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  // User state
  const [currentUser, setCurrentUser] = useState<{ id: number; fullName: string; phone: string; email: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Address states
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Modal thêm địa chỉ nhanh
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newReceiverName, setNewReceiverName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDetailAddress, setNewDetailAddress] = useState("");
  const [newCity, setNewCity] = useState("Hà Nội");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Cart / Items to checkout
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // Booking details
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [customerNote, setCustomerNote] = useState("");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "VNPAY" | "MOMO" | "BANK_TRANSFER">("CASH");

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<any[]>([]);

  // Lưu bảng giá các gói của từng dịch vụ để hiển thị trực tiếp trên giao diện
  const [servicePricingMap, setServicePricingMap] = useState<Record<number, { id: string; title: string; sub: string; price: number; unit: string }[]>>({});
  const [loadingPricingMap, setLoadingPricingMap] = useState(false);

  // Tải bảng giá cho tất cả dịch vụ trong giỏ
  useEffect(() => {
    async function loadAllPricingTables() {
      if (cartItems.length === 0) return;
      const idsToFetch = Array.from(new Set(cartItems.map((item) => item.serviceId))).filter(
        (id) => !servicePricingMap[id]
      );
      if (idsToFetch.length === 0) return;

      try {
        setLoadingPricingMap(true);
        const map: Record<number, any[]> = {};
        await Promise.all(
          idsToFetch.map(async (sid) => {
            try {
              const res = await fetch(`/api/dich-vu/${sid}`);
              const json = await res.json();
              if (json.success && json.data && Array.isArray(json.data.pricingTable)) {
                map[sid] = json.data.pricingTable;
              }
            } catch {}
          })
        );
        setServicePricingMap((prev) => ({ ...prev, ...map }));
      } finally {
        setLoadingPricingMap(false);
      }
    }
    loadAllPricingTables();
  }, [cartItems]);

  // Hàm chọn gói trực tiếp ngay trên trang checkout không cần modal
  const handleSelectOptionDirect = (itemId: number | string, serviceId: number, optionId: string) => {
    const options = servicePricingMap[serviceId] || [];
    const selectedOpt = options.find((o) => o.id === optionId);
    if (!selectedOpt) return;

    const updated = cartItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          priceStart: selectedOpt.price,
          note: selectedOpt.title,
        };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem("cleanmate_cart", JSON.stringify(updated));
  };



  // Hàm xóa dịch vụ trực tiếp khỏi trang checkout
  const handleRemoveCartItem = async (id: number | string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem("cleanmate_cart", JSON.stringify(updated));

    if (typeof id === "number" || !isNaN(Number(id))) {
      try {
        await fetch(`/api/cart?itemId=${id}`, { method: "DELETE" });
      } catch {}
    }
  };

  // Hàm thay đổi số lượng item
  const handleUpdateItemQty = (id: number | string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem("cleanmate_cart", JSON.stringify(updated));
  };

  // 1. Kiểm tra xác thực & tải thông tin người dùng
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setNewReceiverName(data.user.fullName || "");
          setNewPhone(data.user.phone || "");
        } else {
          // Chưa đăng nhập -> chuyển hướng login
          router.push("/login?redirect=/checkout");
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [router]);

  // 2. Tải danh sách địa chỉ của người dùng
  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await fetch("/api/auth/profile/addresses");
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
        // Chọn địa chỉ mặc định
        const defaultAddr = data.addresses.find((a: AddressItem) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0].id);
        }
      }
    } catch (err) {
      console.error("Lỗi tải địa chỉ:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAddresses();
    }
  }, [currentUser]);

  // 3. Tải giỏ hàng từ API (hoặc fallback localStorage)
  useEffect(() => {
    async function loadCartData() {
      try {
        setLoadingCart(true);
        const res = await fetch("/api/cart");
        const data = await res.json();

        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setCartItems(data.items);
        } else {
          // Kiểm tra localStorage "cleanmate_cart" nếu có
          const local = localStorage.getItem("cleanmate_cart");
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCartItems(parsed);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Lỗi tải giỏ hàng:", err);
      } finally {
        setLoadingCart(false);
      }
    }
    loadCartData();
  }, []);

  // Xử lý thêm địa chỉ mới
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceiverName || !newPhone || !newDetailAddress) {
      alert("Vui lòng điền đủ họ tên, số điện thoại và địa chỉ chi tiết");
      return;
    }

    try {
      setIsSavingAddress(true);
      const res = await fetch("/api/auth/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName: newReceiverName,
          phone: newPhone,
          detailAddress: newDetailAddress,
          province: newCity,
          district: "",
          ward: "",
          isDefault: addresses.length === 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.address) {
        await loadAddresses();
        setSelectedAddressId(data.address.id);
        setShowAddAddressModal(false);
      } else {
        alert(data.message || "Không thể lưu địa chỉ");
      }
    } catch {
      alert("Lỗi kết nối khi lưu địa chỉ");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Tính tiền
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.priceStart || 0) * (item.quantity || 1), 0);

  // Xử lý gửi đơn đặt lịch & thanh toán
  const handlePlaceOrder = async () => {
    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("Giỏ hàng đang trống. Vui lòng chọn dịch vụ trước khi thanh toán.");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setErrorMessage("Vui lòng chọn hoặc thêm địa chỉ nhận dịch vụ.");
      return;
    }

    try {
      setIsSubmitting(true);

      const fullAddressStr = [
        selectedAddr.detailAddress,
        selectedAddr.ward,
        selectedAddr.district,
        selectedAddr.province,
      ]
        .filter(Boolean)
        .join(", ");

      const payload = {
        items: cartItems.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity || 1,
          price: item.priceStart,
          scheduledDate: `${scheduledDate}T${scheduledTime}:00`,
          note: item.note || "",
        })),
        address: fullAddressStr,
        receiverName: selectedAddr.receiverName,
        phone: selectedAddr.phone,
        paymentMethod,
        customerNote,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // Xóa giỏ hàng cục bộ nếu có
        localStorage.removeItem("cleanmate_cart");
        setCreatedBookings(data.bookings || []);
        setIsSuccess(true);
      } else {
        setErrorMessage(data.message || "Đặt đơn không thành công. Vui lòng thử lại!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi kết nối khi đặt đơn");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser || loadingCart) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Đang khởi tạo thanh toán...</p>
      </div>
    );
  }

  // MÀN HÌNH ĐẶT ĐƠN THÀNH CÔNG
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header currentPath="/checkout" />
        <main className="max-w-3xl mx-auto px-4 py-16 w-full flex-1 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Đặt lịch dịch vụ thành công!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mb-8">
            Cảm ơn bạn đã lựa chọn CleanMate. Đơn đặt lịch của bạn đã được tiếp nhận và thông báo tới nhà cung cấp.
          </p>

          <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-left shadow-sm mb-8 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 uppercase font-semibold">Hình thức thanh toán:</span>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {paymentMethod === "CASH" && "Tiền mặt khi hoàn thành (COD)"}
                {paymentMethod === "VNPAY" && "Cổng VNPAY"}
                {paymentMethod === "MOMO" && "Ví MoMo"}
                {paymentMethod === "BANK_TRANSFER" && "Chuyển khoản ngân hàng"}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs text-slate-500 uppercase font-semibold block">Các mã đơn dịch vụ:</span>
              {createdBookings.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">{b.bookingCode}</span>
                    <span className="block text-xs text-slate-600 mt-0.5">{b.service?.title}</span>
                  </div>
                  <span className="text-sm font-extrabold text-blue-600">
                    {formatCurrency(Number(b.totalPrice))}
                  </span>
                </div>
              ))}
            </div>

            {/* Thông tin chuyển khoản nếu chọn BANK_TRANSFER */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold">Thông tin tài khoản nhận thanh toán:</div>
                <div>Ngân hàng: <strong>MB Bank (Ngân hàng Quân Đội)</strong></div>
                <div>Số tài khoản: <strong>999988886666</strong></div>
                <div>Chủ tài khoản: <strong>CONG TY CO PHAN CLEANMATE VN</strong></div>
                <div>Nội dung chuyển khoản: <strong>{createdBookings[0]?.bookingCode}</strong></div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/profile"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20"
            >
              Xem lịch sử đơn hàng
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition"
            >
              Quay lại Trang chủ
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Header currentPath="/checkout" />

      {/* BREADCRUMB */}
      <div className="bg-slate-50 border-b border-slate-200/80 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400" />
          <Link href="/cart" className="hover:text-blue-600 transition">Giỏ hàng</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400" />
          <span className="font-semibold text-blue-600">Xác nhận đặt lịch & Thanh toán</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 bg-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
          Xác nhận Đặt lịch & Thanh toán
        </h1>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: ĐỊA CHỈ, THỜI GIAN, PHƯƠNG THỨC THANH TOÁN (8 CỘT) */}
          <div className="lg:col-span-8 space-y-6">
            {/* KHỐI 1: ĐỊA CHỈ NHẬN DỊCH VỤ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Địa chỉ thực hiện dịch vụ</h3>
                    <p className="text-xs text-slate-500">Chọn địa điểm để nhân viên đến phục vụ đúng hẹn</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold border border-purple-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm địa chỉ mới</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-6 text-center text-xs text-slate-400">Đang tải sổ địa chỉ...</div>
              ) : addresses.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Bạn chưa có địa chỉ nhận dịch vụ nào</p>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    + Thêm địa chỉ ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/20 shadow-xs ring-2 ring-purple-500/20"
                            : "border-slate-200 bg-slate-50/50 hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-slate-900">{addr.receiverName}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mb-1">
                            SĐT: <strong>{addr.phone}</strong>
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-2">
                            {[addr.detailAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-end text-xs">
                          {isSelected ? (
                            <span className="text-purple-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                            </span>
                          ) : (
                            <span className="text-slate-400">Nhấn để chọn</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KHỐI GIỮA: DANH SÁCH DỊCH VỤ - HIỂN THỊ TRỰC TIẾP CÁC GÓI ĐỂ CHỌN & SỬA XÓA */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Chi tiết dịch vụ đã đặt</h3>
                    <p className="text-xs text-slate-500">Xem và chọn trực tiếp các gói tùy chọn, điều chỉnh số lượng hoặc xóa dịch vụ</p>
                  </div>
                </div>

                <Link
                  href="/dichvu"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80 transition self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn thêm dịch vụ</span>
                </Link>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Chưa có dịch vụ nào trong đơn đặt lịch</p>
                  <Link
                    href="/dichvu"
                    className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Khám phá dịch vụ
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const options = servicePricingMap[item.serviceId] || [];
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition space-y-4"
                      >
                        {/* Header thông tin dịch vụ */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                              <Image
                                src={item.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/dichvu/${item.serviceId}`}
                                className="font-bold text-sm text-slate-900 hover:text-blue-600 transition line-clamp-1"
                              >
                                {item.title}
                              </Link>

                              <div className="text-xs text-slate-500 mt-0.5">
                                Đối tác cung ứng: <strong className="text-slate-700">{item.shopName}</strong>
                              </div>

                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md font-semibold">
                                  Đang chọn: {item.note || "Gói tiêu chuẩn"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bộ tăng giảm số lượng & Xóa */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 mr-1">SL:</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.id, -1)}
                                className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center cursor-pointer transition"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold text-xs text-slate-800">
                                {item.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.id, 1)}
                                className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center cursor-pointer transition"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right min-w-[100px]">
                              <span className="block font-black text-base text-blue-600">
                                {formatCurrency((item.priceStart || 0) * (item.quantity || 1))}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Xóa dịch vụ này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* DANH SÁCH CÁC GÓI TÙY CHỌN HIỂN THỊ TRỰC TIẾP ĐỂ BẤM CHỌN NGAY */}
                        {options.length > 0 && (
                          <div className="pt-3 border-t border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Các gói tùy chọn (Bấm vào gói để đổi ngay):</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {options.map((opt) => {
                                const isCurrentActive =
                                  item.note === opt.title ||
                                  (!item.note && item.priceStart === opt.price);

                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() => handleSelectOptionDirect(item.id, item.serviceId, opt.id)}
                                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between gap-1 ${
                                      isCurrentActive
                                        ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500/30"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-bold line-clamp-1">{opt.title}</span>
                                      {isCurrentActive && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      )}
                                    </div>

                                    {opt.sub && (
                                      <span className="text-[10px] text-slate-500 line-clamp-1">{opt.sub}</span>
                                    )}

                                    <div className="text-right font-extrabold text-blue-600 pt-0.5">
                                      {formatCurrency(opt.price)}
                                      <span className="text-[10px] font-normal text-slate-400 ml-0.5">{opt.unit}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KHỐI 2: THỜI GIAN THỰC HIỆN DỊCH VỤ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ấn định thời gian làm việc</h3>
                  <p className="text-xs text-slate-500">Khung giờ kỹ thuật viên hoặc nhân viên dọn dẹp sẽ có mặt</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Ngày dọn dẹp / thực hiện <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={scheduledDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Khung giờ bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
                    >
                      <option value="08:00">08:00 Sáng</option>
                      <option value="09:00">09:00 Sáng</option>
                      <option value="10:00">10:00 Sáng</option>
                      <option value="13:30">13:30 Chiều</option>
                      <option value="14:30">14:30 Chiều</option>
                      <option value="16:00">16:00 Chiều</option>
                      <option value="18:00">18:00 Tối</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Ghi chú cho nhân viên (tùy chọn)
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Ví dụ: Nhà có chuông bấm lầu 2, mang thêm máy hút bụi lớn, nhà có nuôi mèo..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* KHỐI 3: PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Phương thức thanh toán</h3>
                  <p className="text-xs text-slate-500">Linh hoạt lựa chọn trả trước online hoặc tiền mặt sau nghiệm thu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Tiền mặt COD */}
                <div
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === "CASH"
                      ? "border-emerald-500 bg-emerald-50/20 shadow-xs ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Tiền mặt (COD)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Thanh toán trực tiếp cho nhân viên sau khi nghiệm thu hài lòng
                    </div>
                  </div>
                </div>

                {/* 2. Cổng VNPAY */}
                <div
                  onClick={() => setPaymentMethod("VNPAY")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === "VNPAY"
                      ? "border-blue-500 bg-blue-50/20 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-extrabold text-xs">
                    VNPAY
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Cổng VNPAY</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Quét mã VNPAY-QR hoặc thẻ ATM / Visa / Mastercard nội địa
                    </div>
                  </div>
                </div>

                {/* 3. Ví MoMo */}
                <div
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === "MOMO"
                      ? "border-pink-500 bg-pink-50/20 shadow-xs ring-2 ring-pink-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 font-extrabold text-xs">
                    MOMO
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Ví điện tử MoMo</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Thanh toán nhanh chóng qua ứng dụng Ví MoMo
                    </div>
                  </div>
                </div>

                {/* 4. Chuyển khoản ngân hàng */}
                <div
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-amber-500 bg-amber-50/20 shadow-xs ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Chuyển khoản (Bank Transfer)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Chuyển khoản qua số tài khoản công ty theo mã đơn
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG & NÚT ĐẶT LỊCH (4 CỘT - STICKY) */}
          <div className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Dịch vụ đã chọn ({cartItems.length})</span>
              </h2>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có dịch vụ nào trong giỏ hàng.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-3 pb-3 mb-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={item.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                        <div className="text-[11px] text-slate-400">Shop: {item.shopName}</div>
                        <div className="text-xs font-bold text-blue-600 mt-0.5">
                          {formatCurrency(item.priceStart)} x {item.quantity || 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600 mb-5">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ CleanMate</span>
                  <span className="font-semibold text-emerald-600">Miễn phí</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian thực hiện</span>
                  <span className="font-semibold text-slate-900">{scheduledDate} ({scheduledTime})</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-4 border-t border-slate-100 mb-6">
                <span className="text-sm font-bold text-slate-900">Tổng thanh toán</span>
                <span className="text-2xl font-black text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý đơn đặt...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận Đặt lịch ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cam kết bảo hành chất lượng 100%. Nhân viên có chứng chỉ nghiệp vụ và lý lịch tư pháp rõ ràng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THÊM ĐỊA CHỈ NHANH */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span>Thêm địa chỉ nhận dịch vụ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên người nhận
                </label>
                <input
                  type="text"
                  required
                  value={newReceiverName}
                  onChange={(e) => setNewReceiverName(e.target.value)}
                  placeholder="Ví dụ: Anh Nam"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, toà nhà, tên đường)
                </label>
                <textarea
                  required
                  value={newDetailAddress}
                  onChange={(e) => setNewDetailAddress(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Căn hộ 12A05, Toà Landmark 2, 720A Điện Biên Phủ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isSavingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Lưu địa chỉ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
