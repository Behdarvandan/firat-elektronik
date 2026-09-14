"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "./CategoryForm";
import { deleteCategory } from "../actions";

interface Category {
  id: number;
  name: string;
  prefix: string;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({
  initialCategories,
}: CategoriesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeletingId(id);
    const result = await deleteCategory(id);
    setDeletingId(null);

    if (result.success) {
      // ✅ Başarılı silme - Sayfayı yenile
      router.refresh();
    } else {
      // ❌ HATA DURUMU - Kullanıcıya detaylı bilgi ver
      // Alert yerine browser'ın native notification API'sini kullan
      const errorMessage = result.error || "Silme işlemi başarısız oldu";

      // Tarayıcı bildirimi oluştur
      if (typeof window !== "undefined") {
        // Kırmızı arka planlı error alert
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "fixed top-4 right-4 z-50 max-w-md bg-red-50 border-l-4 border-red-500 rounded-lg shadow-2xl p-4 animate-slide-in";
        alertDiv.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-red-800 text-sm mb-1">Kategori Silinemedi</h3>
              <p class="text-red-700 text-sm">${errorMessage}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-red-400 hover:text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        `;
        document.body.appendChild(alertDiv);

        // 7 saniye sonra otomatik kaldır
        setTimeout(() => {
          alertDiv.style.opacity = "0";
          alertDiv.style.transform = "translateX(100%)";
          alertDiv.style.transition = "all 0.3s ease-out";
          setTimeout(() => alertDiv.remove(), 300);
        }, 7000);
      }
    }
  };

  const handleFormSuccess = () => {
    router.refresh();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <>
      {/* 📱 Add Button - Mobilde tam genişlik */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Yeni Kategori Ekle
        </button>
      </div>

      {/* 📱 Categories Table - Mobil Overflow Koruması İyileştirildi */}
      <div className="w-full overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-slate-800">
        <div className="bg-slate-900 min-w-max sm:min-w-0">
          {initialCategories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Henüz kategori yok
              </h3>
              <p className="text-slate-400 mb-6">
                İlk kategoriyi eklemek için yukarıdaki butona tıklayın
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">
                    ID
                  </th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">
                    Kategori Adı
                  </th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">
                    Önek
                  </th>
                  <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {initialCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-400 text-sm whitespace-nowrap">
                      {category.id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="text-white font-medium">
                        {category.name}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {category.prefix}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sil"
                        >
                          {deletingId === category.id ? (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <CategoryForm
          category={editingCategory || undefined}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
