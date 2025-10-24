import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import MuiThemeProvider from "./components/MuiThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";

// Fontları tanımlama
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata: OpenAPI şemasındaki bilgileri yansıtacak şekilde
export const metadata = {
  title: "Peppol Tools - ID Validator & PDF Converter",
  description:
    "Validate Peppol Participant IDs, check document support, and convert UBL XML files to PDF instantly. Powered by Peppol Test Directory.",
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
  icons: {
    icon: "/android-chrome-192x192.png",
    apple: "/android-chrome-512x512.png",
  },
  openGraph: {
    title: "Peppol Tools - ID Validator & PDF Converter",
    description:
      "Comprehensive tools for Peppol participant lookup and XML to PDF conversion.",
    url: "https://peppolchecker.online",
    siteName: "Peppol Tools",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 text-gray-900 antialiased`}
      >
        <MuiThemeProvider>
          {/* Navbar: API uç noktalarını destekleyen menü */}
          <Navbar />

          {/* Ana İçerik: Çocuk bileşenler burada render edilecek */}
          <main>
            <Container
              maxWidth="lg"
              sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}
            >
              {children}
            </Container>
          </main>

          {/* Footer: OpenAPI şemasındaki iletişim bilgilerini içerir */}
          <Box component="footer" sx={{ bgcolor: "grey.100", py: 4 }}>
            <Container maxWidth="lg">
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                © {new Date().getFullYear()} Peppol Tools • Built by Can Matik
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <Link
                  href="https://www.linkedin.com/in/can-matik/"
                  style={{
                    color: "#175cd3",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Contact Me
                </Link>{" "}
                for support or feedback
              </Typography>
              <Typography
                variant="caption"
                align="center"
                color="text.secondary"
                component="p"
              >
                Note: The Peppol Test Directory is a voluntary registry and may not
                include all Peppol participants.
              </Typography>
            </Container>
          </Box>

          {/* Vercel Analytics */}
          <Analytics />
        </MuiThemeProvider>
      </body>
    </html>
  );
}