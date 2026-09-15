import Link from "next/link";
import type { Category } from "@/types/catalog";

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 w-full md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.id}`}
          className="block group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <div className="flex flex-col h-full justify-between gap-4">
            <div>
              {/* Kategori İkonu */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base bg-gradient-to-br from-blue-600 to-blue-700 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                {category.prefix || "FRT"}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-700 transition-colors">
                {category.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium group-hover:text-blue-600 transition-colors">
              <span>Ürünleri İncele</span>
              <svg
                className="h-4 w-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
