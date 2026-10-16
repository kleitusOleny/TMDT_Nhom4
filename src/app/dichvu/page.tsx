"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import {
  Search,
  Star,
  MapPin,
  Clock,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  _count?: {
    services: number;
  };
}

interface ShopItem {
  id: number;
  name: string;
  slug: string;
  rating: number;
  totalReviews: number;
  area?: string | null;
  _count?: {
    services: number;
  };
}

interface FilterSidebarProps {
  categories: CategoryItem[];
  selectedCategory: string;
  shops: ShopItem[];
  selectedShop: string;
  minPrice: string;
  maxPrice: string;
  selectedRating: number;
  onSelectCategory: (cat: string) => void;
  onSelectShop: (shop: string) => void;
  onChangeMinPrice: (val: string) => void;
  onChangeMaxPrice: (val: string) => void;
  onSelectRating: (val: number) => void;
  onReset: () => void;
}

interface ServiceItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  priceStart: number | string;
  rating: number;
  totalReviews: number;
  duration?: string | null;
  serviceArea?: string | null;
  images: string[] | string;
  shop: {
    id: number;
    name: string;
    slug: string;
    approvalStatus: string;
    rating: number;
    area?: string | null;
  };
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

function FilterSidebar({
  categories,
  selectedCategory,
  shops,
  selectedShop,
  minPrice,
  maxPrice,
  selectedRating,
  onSelectCategory,
  onSelectShop,
  onChangeMinPrice,
  onChangeMaxPrice,
  onSelectRating,
  onReset,
}: FilterSidebarProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6 sticky top-28">
      {/* Header Filter */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-none">Bộ Lọc Dịch Vụ</h2>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Tùy biến theo nhu cầu</span>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Đặt lại
        </button>
      </div>

      {/* 1. Lọc theo Danh mục */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Danh mục dịch vụ
        </h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectCategory("all")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>Tất cả danh mục</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                selectedCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {categories.reduce((acc, c) => acc + (c._count?.services || 0), 0)}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="truncate pr-2">{cat.name}</span>
              {cat._count && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    selectedCategory === cat.slug
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {cat._count.services}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Lọc theo Nhà Cung Cấp (Đối tác CleanMate) */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Nhà cung cấp
          </h3>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectShop("all")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
              selectedShop === "all"
                ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>Tất cả đối tác</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                selectedShop === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {shops.length}
            </span>
          </button>
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => onSelectShop(shop.slug)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                selectedShop === shop.slug
                  ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="truncate pr-2">
                <div className="truncate">{shop.name}</div>
                {shop.area && (
                  <div className={`text-[10px] truncate ${selectedShop === shop.slug ? "text-blue-100" : "text-slate-400"}`}>
                    {shop.area}
                  </div>
                )}
              </div>
              {shop._count?.services !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                    selectedShop === shop.slug
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {shop._count.services}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Lọc theo Khoảng Giá */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Khoảng giá (VNĐ)
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block font-medium">Từ giá</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => onChangeMinPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block font-medium">Đến giá</label>
            <input
              type="number"
              placeholder="10.000.000"
              value={maxPrice}
              onChange={(e) => onChangeMaxPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
        </div>

        {/* Mức giá gợi ý nhanh */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "< 200k", min: "", max: "200000" },
            { label: "200k - 500k", min: "200000", max: "500000" },
            { label: "> 500k", min: "500000", max: "" },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChangeMinPrice(preset.min);
                onChangeMaxPrice(preset.max);
              }}
              className="text-[11px] py-1.5 px-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 rounded-lg transition font-medium cursor-pointer text-center"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Lọc theo Đánh Giá Sao */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Đánh giá đối tác
        </h3>
        <div className="space-y-1.5">
          {[5, 4, 3].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                const nextRating = selectedRating === star ? 0 : star;
                onSelectRating(nextRating);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer border ${
                selectedRating === star
                  ? "bg-amber-50/60 text-amber-900 font-bold border-amber-300 shadow-2xs"
                  : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span>từ {star} sao</span>
              </div>
              {selectedRating === star && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded">
                  Đã chọn
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Các giá trị Filter
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedShop, setSelectedShop] = useState(searchParams.get("shop") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [selectedRating, setSelectedRating] = useState<number>(
    searchParams.get("rating") ? Number(searchParams.get("rating")) : 0
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // State dữ liệu
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile drawer filter toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch dữ liệu từ API mỗi khi bộ lọc thay đổi
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedShop && selectedShop !== "all") params.set("shop", selectedShop);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (selectedRating > 0) params.set("rating", String(selectedRating));
        if (sortBy) params.set("sortBy", sortBy);

        const res = await fetch(`/api/dich-vu?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Không thể tải danh sách dịch vụ");
        }

        if (!isCancelled) {
          setServices(json.data.services || []);
          setCategories(json.data.categories || []);
          setShops(json.data.shops || []);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [search, selectedCategory, selectedShop, minPrice, maxPrice, selectedRating, sortBy]);

  // Cập nhật URL Query
  const updateQueryUrl = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === "" || val === 0 || val === "all") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    startTransition(() => {
      router.replace(`/dichvu?${params.toString()}`, { scroll: false });
    });
  };

  const handleResetFilter = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShop("all");
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(0);
    setSortBy("newest");
    router.replace("/dichvu", { scroll: false });
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return isNaN(num) ? "0đ" : new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Header currentPath="/dichvu" showSearchOrBooking={true} />

      {/* BREADCRUMB */}
      <div className="bg-slate-50/70 border-b border-slate-200/60 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-blue-600 transition">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-blue-600">Danh sách Dịch vụ</span>
          </div>
          <span className="hidden sm:inline text-slate-500 font-medium">
            Tìm thấy <strong className="text-blue-600 font-bold">{services.length}</strong> dịch vụ phù hợp
          </span>
        </div>
      </div>

      {/* MAIN CONTAINER: BỘ LỌC TRÁI - DANH SÁCH DỊCH VỤ PHẢI TRÊN NỀN TRẮNG */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full bg-white">
        {/* THANH TÌM KIẾM & SẮP XẾP NHANH TRÊN CÙNG */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ (nhà ở, văn phòng, giặt nệm...)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateQueryUrl({ search: e.target.value });
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>

          {/* Sắp xếp, Chọn nhà cung cấp & Nút mở filter trên Mobile */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Lọc nhà cung cấp nhanh trên thanh công cụ */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={selectedShop}
                onChange={(e) => {
                  setSelectedShop(e.target.value);
                  updateQueryUrl({ shop: e.target.value });
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer max-w-[150px] sm:max-w-[180px] truncate"
              >
                <option value="all">Tất cả nhà cung cấp</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateQueryUrl({ sortBy: e.target.value });
                }}
                className="bg-white border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-800 outline-none cursor-pointer focus:border-blue-500 shadow-2xs"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {/* Nút lọc cho điện thoại */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              Bộ lọc
            </button>
          </div>
        </div>

        {/* CÁC THẺ TAG BỘ LỌC ĐANG CHỌN (ACTIVE FILTER TAGS) */}
        {(selectedCategory !== "all" || selectedShop !== "all" || minPrice || maxPrice || selectedRating > 0 || search.trim()) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Đang lọc:
            </span>

            {/* Tag Nhà cung cấp */}
            {selectedShop !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-blue-700 shadow-xs">
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>Nhà cung cấp: {shops.find((s) => s.slug === selectedShop)?.name || selectedShop}</span>
                <button
                  onClick={() => {
                    setSelectedShop("all");
                    updateQueryUrl({ shop: "all" });
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Tag Danh mục */}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-blue-700 shadow-xs">
                <span>Danh mục: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    updateQueryUrl({ category: "all" });
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Tag Tìm kiếm */}
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-slate-700 shadow-xs">
                <span>Từ khóa: "{search.trim()}"</span>
                <button
                  onClick={() => {
                    setSearch("");
                    updateQueryUrl({ search: "" });
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Tag Giá */}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-slate-700 shadow-xs">
                <span>Giá: {minPrice ? formatCurrency(minPrice) : "0đ"} - {maxPrice ? formatCurrency(maxPrice) : "Tối đa"}</span>
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    updateQueryUrl({ minPrice: "", maxPrice: "" });
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Tag Đánh giá */}
            {selectedRating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-amber-700 shadow-xs">
                <span>★ từ {selectedRating} sao</span>
                <button
                  onClick={() => {
                    setSelectedRating(0);
                    updateQueryUrl({ rating: 0 });
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilter}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-auto px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* LAYOUT 2 CỘT: BỘ LỌC BÊN TRÁI (LEFT SIDEBAR) - DANH SÁCH DỊCH VỤ BÊN PHẢI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (4 CỘT): BỘ LỌC FILTER BÊN TRÁI (DESKTOP) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              shops={shops}
              selectedShop={selectedShop}
              minPrice={minPrice}
              maxPrice={maxPrice}
              selectedRating={selectedRating}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                updateQueryUrl({ category: cat });
              }}
              onSelectShop={(shop) => {
                setSelectedShop(shop);
                updateQueryUrl({ shop });
              }}
              onChangeMinPrice={(val) => {
                setMinPrice(val);
                updateQueryUrl({ minPrice: val });
              }}
              onChangeMaxPrice={(val) => {
                setMaxPrice(val);
                updateQueryUrl({ maxPrice: val });
              }}
              onSelectRating={(val) => {
                setSelectedRating(val);
                updateQueryUrl({ rating: val });
              }}
              onReset={handleResetFilter}
            />
          </aside>

          {/* CỘT PHẢI (8 CỘT HOẶC 9 CỘT): DANH SÁCH DỊCH VỤ */}
          <div className="lg:col-span-8 xl:col-span-9">
            {isLoading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách dịch vụ...</p>
              </div>
            ) : error ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">Không thể tải dữ liệu</h3>
                <p className="text-sm text-slate-500 mb-4">{error}</p>
                <button
                  onClick={handleResetFilter}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : services.length === 0 ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy dịch vụ phù hợp</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                  Hãy thử điều chỉnh lại bộ lọc giá, từ khóa tìm kiếm hoặc chọn danh mục khác.
                </p>
                <button
                  onClick={handleResetFilter}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {services.map((item) => {
                  const firstImage = Array.isArray(item.images)
                    ? item.images[0]
                    : typeof item.images === "string"
                    ? item.images
                    : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80";

                  return (
                    <Link
                      key={item.id}
                      href={`/dichvu/${item.id}`}
                      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col"
                    >
                      {/* Ảnh đại diện dịch vụ */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <Image
                          src={firstImage}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 shadow-xs flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          <span className="truncate max-w-[130px]">{item.shop?.name}</span>
                        </div>
                        {item.shop?.approvalStatus === "APPROVED" && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full shadow-xs" title="Đối tác đã xác thực">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Thông tin dịch vụ */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Rating & Thời lượng */}
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{item.rating || 5.0}</span>
                              <span className="text-slate-400 font-normal">({item.totalReviews})</span>
                            </div>
                            {item.duration && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>{item.duration}</span>
                              </div>
                            )}
                          </div>

                          {/* Tiêu đề */}
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5 leading-snug">
                            {item.title}
                          </h3>

                          {/* Mô tả ngắn */}
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        </div>

                        {/* Giá khởi điểm & Khu vực */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Khởi điểm</span>
                            <span className="text-base font-extrabold text-blue-600">
                              {formatCurrency(item.priceStart)}
                            </span>
                          </div>
                          {item.serviceArea && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 max-w-[120px] truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.serviceArea}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL / DRAWER FILTER CHO MOBILE */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Bộ Lọc Dịch Vụ</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-md"
                >
                  Đóng
                </button>
              </div>
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                shops={shops}
                selectedShop={selectedShop}
                minPrice={minPrice}
                maxPrice={maxPrice}
                selectedRating={selectedRating}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  updateQueryUrl({ category: cat });
                }}
                onSelectShop={(shop) => {
                  setSelectedShop(shop);
                  updateQueryUrl({ shop });
                }}
                onChangeMinPrice={(val) => {
                  setMinPrice(val);
                  updateQueryUrl({ minPrice: val });
                }}
                onChangeMaxPrice={(val) => {
                  setMaxPrice(val);
                  updateQueryUrl({ maxPrice: val });
                }}
                onSelectRating={(val) => {
                  setSelectedRating(val);
                  updateQueryUrl({ rating: val });
                }}
                onReset={handleResetFilter}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ServiceListPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ServiceListContent />
    </React.Suspense>
  );
}
