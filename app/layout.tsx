import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NotificationContainer from "../components/NotificationContainer";
import BottomNavigation from "../components/BottomNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JUNIOR - Automated Trading Platform",
  description: "Connect trading accounts, receive real-time signals, and execute trades automatically across multiple brokers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <NotificationContainer />
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}