import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import MuiThemeProvider from "./components/MuiThemeProvider";

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
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 text-gray-900`}>
        <MuiThemeProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-semibold mb-4 text-center text-blue-700">
              Peppol ID Validator
            </h1>
            <p className="text-center text-gray-600 mb-10">
              Instantly validate participant IDs and check which document formats are supported 
              across the Peppol network.
            </p>
            <section className="bg-white shadow-md rounded-2xl p-6 border border-gray-100">
              {children}
            </section>
            <footer className="text-center text-sm text-gray-500 mt-10 mb-4">
              © {new Date().getFullYear()} Analyseasy · Built with Next.js
            </footer>
          </main>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
