// "use client"
// This component must be a client component to handle MUI's theme context.
"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/app/theme"; // Adjust path as necessary, assuming theme is in app/theme.js

export default function MuiThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline must also be inside ThemeProvider */}
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}