import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@mui/material/styles"; // <-- REMOVE
// import { CssBaseline } from "@mui/material"; // <-- REMOVE
// import { theme } from "./theme"; // <-- REMOVE (or keep if Navbar needs it, but it should be inside the client boundary)
import Navbar from "./components/Navbar";
import MuiThemeProvider from "./components/MuiThemeProvider"; // <-- ADDED

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
  description: "Validate Peppol Participant ID's and check document support",
};

// RootLayout is a Server Component by default
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/*
          MuiThemeProvider is a client component and safely wraps 
          the problematic theme/CSS context.
        */}
        <MuiThemeProvider> 
          <Navbar />
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}