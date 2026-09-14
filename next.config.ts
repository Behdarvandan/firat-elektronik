/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {},
  // SheetJS (xlsx) Node yerleşiklerini (fs/crypto) kullanır; sunucu bileşenleri
  // tarafında native require ile yüklenmesi için bundle dışı bırakıyoruz.
  serverExternalPackages: ["xlsx"],
  experimental: {
    serverActions: {
      // Excel dosyaları 1MB'lık varsayılan sunucu aksiyonu limitini aşabildiği
      // için limiti 10MB'a çıkarıyoruz.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
