import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./components/CartProvider";
import CartDrawer from "./components/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_TITLE = "Fırat Elektronik - B2B Ürün Kataloğu ve Bayi Portalı";
const SITE_DESCRIPTION =
  "Telefon aksesuarları ve koruyucu ürünler için profesyonel B2B katalog ve bayi portalı. 10.000'den fazla model, anlık stok sorgulama ve güncel teknik özellikler.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Fırat Elektronik",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Fırat Elektronik",
    "B2B ürün kataloğu",
    "bayi portalı",
    "telefon aksesuarları",
    "koruyucu ürünler",
    "toptan telefon aksesuar",
  ],
  applicationName: "Fırat Elektronik",
  authors: [{ name: "Fırat Elektronik" }],
  creator: "Fırat Elektronik",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Fırat Elektronik",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
