"use client";

import { useState } from "react";
import { loginAction } from "./actions";
import { SITE_NAME } from "@/lib/site-config";

export default function B2BLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
      // Başarılı ise sunucu aksiyonu redirect yapar (admin girişiyle aynı akış)
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          {/* Başlık */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {SITE_NAME}
            </h1>
            <p className="text-slate-500 text-sm">Bayi Paneli — Giriş Yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-posta */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                E-posta
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="bayi@firma.com"
                disabled={loading}
              />
            </div>

            {/* Firma Adı */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Firma Adı
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                autoComplete="organization"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Firma adınız"
                disabled={loading}
              />
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            İskelet sürüm: ilk girişte bayi kaydı otomatik oluşturulur.
          </p>
        </div>
      </div>
    </div>
  );
}
