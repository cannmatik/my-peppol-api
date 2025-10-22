import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import MuiThemeProvider from "./components/MuiThemeProvider";
import { Analytics } from '@vercel/analytics/next';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Peppol ID Validator",
  description: "Validate Peppol Participant IDs and check document support instantly.",
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
  icons: {
    icon: "/android-chrome-192x192.png",
    apple: "/android-chrome-512x512.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 text-gray-900 antialiased`}
      >
        <MuiThemeProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-6 py-10">
            {children}
          </main>
        </MuiThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
