"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Trash2,
    // MapPin,
    Calendar,
    Clock,
    ChevronRight,
    ShieldCheck,
    Building2,
    ArrowRight,
    Info
} from "lucide-react";
import Header from "@/src/components/Header";

const mockCartItems = [
    {
        id: "1",
        service: {
            id: 101,
            title: "Vệ sinh máy lạnh Inverter trọn gói",
            priceStart: 250000,
            image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
            shop: { name: "Điện lạnh An Khang" }
        },
        quantity: 2, // 2 máy
        workingDate: "2026-10-25",
        workingTime: "09:00",
        notes: "Máy số 2 ở phòng ngủ lầu 1 hơi khó leo"
    },
    {
        id: "2",
        service: {
            id: 102,
            title: "Tổng vệ sinh nhà ở sau xây dựng",
            priceStart: 1500000,
            image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=300&q=80",
            shop: { name: "CleanSpace Pro" }
        },
        quantity: 1,
        workingDate: "2026-10-26",
        workingTime: "14:00",
        notes: ""
    }
];

export default function CartPage() {
    const [cartItems, setCartItems] = useState(mockCartItems);

    // Hàm định dạng tiền tệ
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("vi-VN").format(val) + "đ";
    };

    // Tính tổng tiền
    const totalAmount = cartItems.reduce((acc, item) => acc + item.service.priceStart * item.quantity, 0);

    const removeItem = (id: string) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans flex flex-col">
            <Header currentPath="/cart" showSearchOrBooking={false} />

            {/* BREADCRUMB */}
            <div className="bg-white border-b border-slate-200/60 py-3.5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-xs text-slate-500">
                    <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
                    <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400" />
                    <span className="font-semibold text-blue-600">Giỏ hàng của bạn</span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
                    Giỏ hàng dịch vụ
                </h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Giỏ hàng đang trống</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Bạn chưa chọn dịch vụ nào. Hãy khám phá các gói vệ sinh chất lượng từ đối tác của chúng tôi nhé.</p>
                        <Link
                            href="/dichvu"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30"
                        >
                            Xem danh sách dịch vụ <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM TRONG GIỎ */}
                        <div className="lg:col-span-8 space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm hover:border-blue-200 transition">
                                    {/* Ảnh dịch vụ */}
                                    <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                        <Image
                                            src={item.service.image}
                                            alt={item.service.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Chi tiết */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                                                    {item.service.title}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-slate-400 hover:text-rose-500 transition p-1"
                                                    title="Xóa khỏi giỏ"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 w-fit px-2 py-1 rounded-md mb-4">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {item.service.shop.name}
                                            </div>

                                            {/* Các thông tin đặt lịch cơ bản */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span>Ngày: <strong>{item.workingDate}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span>Giờ: <strong>{item.workingTime}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-slate-500">Số lượng:</span>
                                                <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-lg text-sm">
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div className="text-right">
                        <span className="block text-lg font-extrabold text-blue-600">
                          {formatCurrency(item.service.priceStart * item.quantity)}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CỘT PHẢI: TỔNG KẾT & THANH TOÁN (STICKY) */}
                        <div className="lg:col-span-4 sticky top-28">
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-5 pb-4 border-b border-slate-100">
                                    Tổng đơn hàng
                                </h2>

                                <div className="space-y-4 mb-6 text-sm">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tạm tính ({cartItems.length} dịch vụ)</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Phí nền tảng</span>
                                        <span className="font-semibold text-emerald-600">Miễn phí</span>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between pt-4 border-t border-slate-100 mb-6">
                                    <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                                    <span className="text-2xl font-black text-blue-600">{formatCurrency(totalAmount)}</span>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-4"
                                >
                                    Tiến hành Đặt lịch & Thanh toán
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
        </div>
    );
}