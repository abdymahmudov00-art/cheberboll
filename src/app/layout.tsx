import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import { DataProvider } from "@/components/providers/DataProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cheber Boll",
    template: "%s · Cheber Boll",
  },
  description: "Турниры по настольному теннису: таблицы, сетки, счёт матчей и рейтинг игроков",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DataProvider>
          <Header />
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:py-8">{children}</main>
          <Footer />
        </DataProvider>
      </body>
    </html>
  );
}
