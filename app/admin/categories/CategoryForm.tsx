"use client";

import { useState, useEffect } from "react";
import { addCategory, updateCategory } from "../actions";

interface CategoryFormProps {
  category?: {
    id: number;
    name: string;
    prefix: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryForm({
  category,
  onClose,
  onSuccess,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    prefix: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        prefix: category.prefix,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (category) {
        // Güncelleme
        result = await updateCategory(category.id, formData);
      } else {
        // Yeni ekleme
        result = await addCategory(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Bir hata oluştu");
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            {category ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Kategori Adı
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Samsung"
              required
            />
          </div>

          <div>
            <label
              htmlFor="prefix"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Önek (Prefix)
            </label>
            <input
              type="text"
              id="prefix"
              value={formData.prefix}
              onChange={(e) =>
                setFormData({ ...formData, prefix: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: SM"
              required
            />
            <p className="text-slate-400 text-xs mt-1">
              Ürün kodlarında kullanılacak kısa kod
            </p>
          </div>

          {/* 📱 Buttons - Mobilde alt alta, masaüstünde yan yana */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors order-2 sm:order-1"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              disabled={loading}
            >
              {loading ? "Kaydediliyor..." : category ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
