import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/components/Provider";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadataBase = new URL('https://movegallery-bice.vercel.app'); 

export const metadata: Metadata = {
  title: "MOVE Gallery",
  description: "The official Move Industries ecosystem",

  icons: {
    icon: '/brand-logo.png',
    shortcut: '/brand-logo.png',
    apple: '/brand-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#050505] text-white antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <Provider>
            <Navbar />
            <main className="container mx-auto pt-4">
              {children}
            </main>
          </Provider>
        </SessionProvider>
      </body>
    </html>
  );
}