"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building2,
  ArrowRight,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

interface CartItemModel {
  id: number | string;
  serviceId: number;
  title: string;
  priceStart: number;
  image: string;
  shopName: string;
  quantity: number;
  scheduledDate?: string;
  workingTime?: string;
  note?: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách giỏ hàng thực từ Database và localStorage (không mock)
  useEffect(() => {
    async function loadCart() {
      try {
        setLoading(true);
        // 1. Tải từ API database người dùng
        const res = await fetch("/api/cart");
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setCartItems(data.items);
          localStorage.setItem("cleanmate_cart", JSON.stringify(data.items));
        } else {
          // 2. Nếu chưa có trên API (khách vãng lai), tải từ localStorage thực tế đã bấm "Thêm vào giỏ"
          const local = localStorage.getItem("cleanmate_cart");
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCartItems(parsed);
                return;
              }
            } catch {
              // ignore
            }
          }
          // Hoàn toàn không mock: nếu không có thì giỏ trống
          setCartItems([]);
        }
      } catch (err) {
        console.error("Lỗi tải giỏ hàng:", err);
        const local = localStorage.getItem("cleanmate_cart");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              setCartItems(parsed);
              return;
            }
          } catch {}
        }
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, []);

  // Định dạng tiền tệ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  // Tính tổng tiền thực
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (item.priceStart || 0) * (item.quantity || 1),
    0
  );

  const removeItem = async (id: number | string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem("cleanmate_cart", JSON.stringify(updated));

    if (typeof id === "number" || !isNaN(Number(id))) {
      try {
        await fetch(`/api/cart?itemId=${id}`, { method: "DELETE" });
      } catch {
        // ignore
      }
    }
  };

  const updateQuantity = (id: number | string, delta: number) => {
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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Header currentPath="/cart" showSearchOrBooking={false} />

      {/* BREADCRUMB */}
      <div className="bg-slate-50 border-b border-slate-200/80 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400" />
          <span className="font-semibold text-blue-600">Giỏ hàng của bạn</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 bg-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
          Giỏ hàng dịch vụ
        </h1>

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600 mb-3" />
            <span className="text-sm font-medium text-slate-500">Đang kiểm tra giỏ hàng...</span>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm">
              Bạn chưa có dịch vụ nào trong giỏ hàng. Hãy khám phá và đặt lịch các gói vệ sinh uy tín từ đối tác của CleanMate.
            </p>
            <Link
              href="/dichvu"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 text-sm"
            >
              Xem danh sách dịch vụ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* CỘT TRÁI: DANH SÁCH DỊCH VỤ THỰC TẾ (8 CỘT) */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-xs hover:border-blue-300 transition"
                >
                  {/* Ảnh dịch vụ */}
                  <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <Image
                      src={item.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Chi tiết */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Link
                          href={`/dichvu/${item.serviceId}`}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 w-fit px-2.5 py-1 rounded-md mb-4">
                        <Building2 className="w-3.5 h-3.5" />
                        {item.shopName}
                      </div>

                      {/* Các thông tin đặt lịch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            Ngày hẹn: <strong>{item.scheduledDate || "Chưa ấn định"}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>
                            Giờ hẹn: <strong>{item.workingTime || "09:00"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-1">Số lượng:</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-sm flex items-center justify-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="bg-slate-50 text-slate-800 font-bold px-3 py-1 rounded-lg text-sm border border-slate-200">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-sm flex items-center justify-center transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-extrabold text-blue-600">
                          {formatCurrency((item.priceStart || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CỘT PHẢI: TỔNG KẾT & TIẾN HÀNH ĐẶT LỊCH (4 CỘT) */}
            <div className="lg:col-span-4 sticky top-28">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-5 pb-4 border-b border-slate-100">
                  Tổng đơn dịch vụ
                </h2>

                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính ({cartItems.length} dịch vụ)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí dịch vụ sàn</span>
                    <span className="font-semibold text-emerald-600">Miễn phí</span>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100 mb-6">
                  <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-blue-600">{formatCurrency(totalAmount)}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => {
                    localStorage.setItem("cleanmate_cart", JSON.stringify(cartItems));
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-4"
                >
                  <span>Tiến hành Đặt lịch & Thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bạn được bảo vệ bởi chính sách <strong>Bảo hành hài lòng 100%</strong> của CleanMate. Hoàn tiền nếu dịch vụ không đạt chất lượng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
