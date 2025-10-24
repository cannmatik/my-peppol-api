"use client";
import { useEffect, useRef } from "react";
import { Box, Container, Typography, Fade, Alert, useTheme } from "@mui/material";
import "../styles.css";

export default function ApiDocsPage() {
  const theme = useTheme();
  const scriptRef = useRef(null); // Script'i takip etmek için
  const containerRef = useRef(null); // Redoc container'ı takip için
  const isMounted = useRef(true); // Component mount durumunu takip için

  useEffect(() => {
    isMounted.current = true;

    // Script oluştur
    const script = document.createElement("script");
    script.src = "https://cdn.redoc.ly/redoc/v2.1.5/bundles/redoc.standalone.js"; // Sabit sürüm
    script.async = true;
    scriptRef.current = script;

    script.onload = async () => {
      if (!isMounted.current) return;

      try {
        const res = await fetch("/openapi.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch openapi.json: ${res.status}`);
        const spec = await res.json();

        // Redoc'u başlat
        window.Redoc.init(
          spec,
          {
            hideDownloadButton: false,
            nativeScrollbars: true,
            theme: {
              colors: {
                primary: { main: theme.palette.secondary.main },
                text: {
                  primary: theme.palette.text.primary,
                  secondary: theme.palette.text.secondary,
                },
                http: {
                  get: "#059669",
                  post: theme.palette.primary.main,
                  put: "#d97706",
                  delete: "#dc2626",
                },
              },
              typography: {
                fontFamily: theme.typography.fontFamily,
                headings: { fontWeight: "700" },
                code: { color: theme.palette.primary.main },
              },
              sidebar: { backgroundColor: theme.palette.background.paper },
            },
          },
          document.getElementById("redoc-container")
        );
      } catch (error) {
        if (isMounted.current) {
          console.error("Redoc initialization failed:", error);
        }
      }
    };

    script.onerror = () => {
      if (isMounted.current) {
        console.error("Failed to load Redoc script");
      }
    };

    // Script'i ekle
    document.body.appendChild(script);

    // Cleanup
    return () => {
      isMounted.current = false;

      try {
        // Redoc container'ını manuel temizle
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Script'i güvenli kaldır
        if (scriptRef.current && scriptRef.current.parentNode) {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
        }
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
    };
  }, [theme]);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
      <Fade in timeout={800}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" component="h1">
            API Documentation
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1.5, maxWidth: "600px", mx: "auto" }}
          >
            Explore the Peppol Tools API for participant lookup, PDF generation, and more.
            Powered by Peppol Test Directory and Neon database.
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ mb: 4 }}>
        <Alert
          severity="info"
          sx={{
            borderRadius: theme.shape.borderRadius,
            background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.primary.light} 100%)`,
            color: theme.palette.primary.main,
            "& .MuiAlert-icon": { color: theme.palette.secondary.main },
          }}
        >
          <strong>Note:</strong> The <code>/api/check</code> endpoint uses data from
          the{" "}
          <a
            href="https://test-directory.peppol.eu/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.palette.primary.main, fontWeight: 600 }}
          >
            Peppol Test Directory
          </a>
          . Since this directory is parallel, missing results don't mean the
          participant isn't active in the Peppol network.
        </Alert>
      </Box>

      <Box
        id="redoc-container"
        ref={containerRef}
        sx={{
          width: "100%",
          minHeight: "600px",
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${theme.palette.grey[200]}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      />

      <Box
        sx={{
          textAlign: "center",
          mt: 4,
          pt: 4,
          borderTop: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
          © {new Date().getFullYear()} Peppol Tools — Built by Can Matik
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          Live at{" "}
          <a
            href="https://peppolchecker.online/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.palette.primary.main, fontWeight: 500 }}
          >
            peppolchecker.online
          </a>
        </Typography>
      </Box>
    </Container>
  );
}