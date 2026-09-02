import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Trendy Kiddos | Mother & Baby Essentials",
  description: "Premium baby food, skincare, clothing and nursery essentials for growing families.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://xachljqxtnhnmbpcnymt.supabase.co" />
        <link rel="preconnect" href="https://xachljqxtnhnmbpcnymt.supabase.co" />
      </head>
      <body>
        <LocationProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
