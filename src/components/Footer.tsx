import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Clean<span className="text-blue-400">Mate</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed mb-4 text-slate-400">
            Nền tảng thương mại điện tử chuyên cung cấp dịch vụ dọn dẹp, vệ sinh công nghiệp và gia đình chuyên nghiệp.
          </p>
          <p className="text-xs text-slate-500">© 2026 CleanMate Inc. All rights reserved.</p>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Dịch vụ</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/dichvu?category=ve-sinh-nha-o" className="hover:text-white transition">
                Vệ sinh nhà ở toàn diện
              </Link>
            </li>
            <li>
              <Link href="/dichvu?category=ve-sinh-van-phong" className="hover:text-white transition">
                Vệ sinh văn phòng
              </Link>
            </li>
            <li>
              <Link href="/dichvu?category=giat-sofa-nem" className="hover:text-white transition">
                Giặt ghế sofa & nệm thảm
              </Link>
            </li>
            <li>
              <Link href="/dichvu?category=ve-sinh-may-lanh" className="hover:text-white transition">
                Vệ sinh máy lạnh inverter
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/#how-it-works" className="hover:text-white transition">
                Quy trình đặt dịch vụ
              </Link>
            </li>
            <li>
              <Link href="/#guarantee" className="hover:text-white transition">
                Chính sách bảo hành 24h
              </Link>
            </li>
            <li>
              <Link href="/dichvu" className="hover:text-white transition">
                Bảng giá niêm yết
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Liên hệ</h4>
          <p className="text-xs text-slate-400 mb-2">Hotline: 1900 1234 (8:00 - 21:00)</p>
          <p className="text-xs text-slate-400 mb-2">Email: support@cleanmate.vn</p>
          <p className="text-xs text-slate-400">Địa chỉ: Tòa nhà TechHub, TP. Hồ Chí Minh</p>
        </div>
      </div>
    </footer>
  );
}
