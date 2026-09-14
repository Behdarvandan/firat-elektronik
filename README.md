Bu proje, telefon aksesuarları/koruyucu ürünler için **white-label bir ürün-uyumluluk kataloğu şablonudur**. Next.js ([`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) ile başlatılmıştır) ve Supabase üzerine kuruludur; marka/site metinleri `lib/site-config.ts` üzerinden env değişkenleriyle yönetildiği için tek bir kod tabanı, config + seed data değiştirilerek farklı müşteriler için yeniden deploy edilebilir.

<!-- Test comment: Git configuration updated ✅ -->

## Nasıl Yeni Müşteriye Uyarlanır

1. **Ortam değişkenlerini ayarla**: `.env.example` dosyasını `.env.local` olarak kopyala, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_FOOTER_TEXT` ve `NEXT_PUBLIC_ADMIN_PANEL_NAME` değerlerini yeni müşteriye göre doldur (bkz. `lib/site-config.ts`).
2. **Supabase projesini bağla**: Yeni müşteri için ayrı bir Supabase projesi oluştur, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` değerlerini gir.
3. **Seed data'yı değiştir**: `data/*.json` dosyalarındaki UNIPRO demo ürün/kategori verisini müşterinin kendi kataloğuyla değiştir, ardından `/api/seed` endpoint'ini çalıştırarak Supabase'e yükle.
4. **Admin şifresini güncelle**: `ADMIN_PASSWORD` ve `ADMIN_SESSION_SECRET` değerlerini yeni müşteriye özel, güvenli değerlerle değiştirip deploy et.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
