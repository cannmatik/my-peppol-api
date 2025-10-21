"use client";
import { useState } from "react";
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Fade,
  Zoom,
  IconButton
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import DescriptionIcon from "@mui/icons-material/Description";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// 🔹 API Docs stil dosyası
import "./api-docs.css"; // api-main-title, content-paper, cta-button, vb. sınıflar için

export default function XmlToPdfPage() {
  const [xmlFile, setXmlFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Please select an XML file");
      return;
    }
    setXmlFile(file);
    setPreview(`Selected file: ${file.name}`);
    setError("");
    setConversionResult(null);
  };

  const handleConvert = async () => {
    if (!xmlFile) {
      setError("Please select an XML file");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("xml", xmlFile);

    try {
      const response = await fetch("/api/xml-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "API error");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-document.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      setConversionResult({
        success: true,
        message: "PDF successfully generated and downloaded",
        fileName: "converted-document.pdf",
      });
      setError("");
    } catch (err) {
      setError("PDF conversion error: " + err.message);
      setConversionResult(null);
    } finally {
      setLoading(false);
    }
  };

  const fileExamples = [
    { name: "UBL Invoice", type: "INV", description: "Standard commercial invoice" },
    { name: "UBL Credit Note", type: "CN", description: "Credit note document" },
    { name: "UBL Order", type: "ORD", description: "Purchase order" },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Container maxWidth="lg" className="api-docs-container">
        {/* Header */}
        <Box textAlign="center" className="api-header-box">
          <Fade in timeout={800}>
            <Box>
              <Typography
                component="h1"
                className="api-main-title"
                sx={{ mb: 2 }}
              >
                XML to PDF Converter
              </Typography>
              <Typography
                className="api-subtitle"
                sx={{ lineHeight: 1.6 }}
              >
                Convert UBL XML documents to professional PDF invoices with perfect formatting
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Main Content */}
        <Box>
          <Grid container spacing={4} justifyContent="center" className="api-main-grid">
            {/* Left: Upload Panel */}
            <Grid item xs={12} md={6} lg={5}>
              <Zoom in timeout={600}>
                {/* content-paper tabanı + quick-start-card görünümü */}
                <Paper elevation={0} className="content-paper quick-start-card">
                  <Box className="quick-start-content">
                    {/* Upload Area */}
                    <Box sx={{ textAlign: "center" }}>
                      <Box sx={{ mb: 3 }}>
                        <DescriptionIcon className="quick-start-icon" />
                      </Box>

                      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }} color="text.primary">
                        Upload XML File
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Select your UBL XML document to convert to professional PDF format
                      </Typography>

                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1.2,
                          fontWeight: 600,
                          border: "2px dashed #e2e8f0",
                          textTransform: "none",
                          "&:hover": { border: "2px dashed #175cd3", background: "#f0f9ff" },
                        }}
                      >
                        Choose XML File
                        <input type="file" accept=".xml" hidden onChange={handleFileChange} />
                      </Button>

                      {preview && (
                        <Fade in timeout={300}>
                          {/* endpoint-box görünümü (beyaz + border + radius) */}
                          <Box className="endpoint-box" sx={{ mt: 2, justifyContent: "center" }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography fontWeight={600} color="text.primary">
                              {preview}
                            </Typography>
                          </Box>
                        </Fade>
                      )}
                    </Box>

                    {/* Convert Button - CTA */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={!xmlFile || loading}
                      onClick={handleConvert}
                      className="cta-button"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      sx={{ mt: 2 }}
                    >
                      {loading ? "Converting..." : "Convert to PDF"}
                    </Button>

                    {/* Supported Types */}
                    <Box sx={{ mt: 4 }}>
                      <Typography fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Supported Document Types
                      </Typography>
                      <Grid container spacing={2}>
                        {fileExamples.map((ex, i) => (
                          <Grid item xs={12} sm={4} key={i}>
                            <Card variant="outlined" className="example-card">
                              <CardContent sx={{ textAlign: "center" }}>
                                <Typography fontWeight={700} sx={{ mb: 0.5 }} color="text.primary">
                                  {ex.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                  {ex.description}
                                </Typography>
                                <Chip label={ex.type} size="small" color="primary" />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                </Paper>
              </Zoom>
            </Grid>

            {/* Right: Result / Loading */}
            <Grid item xs={12} md={6} lg={7}>
              <Box sx={{ minHeight: 600 }}>
                {loading && (
                  <Fade in timeout={500}>
                    <Paper elevation={0} className="content-paper" sx={{ p: 8, textAlign: "center" }}>
                      <CircularProgress size={80} color="primary" />
                      <Typography variant="h4" sx={{ mt: 3, mb: 1, fontWeight: 700 }} color="text.primary">
                        Converting XML to PDF...
                      </Typography>
                      <Typography color="text.secondary">
                        Processing your document and generating PDF
                      </Typography>
                    </Paper>
                  </Fade>
                )}

                {error && (
                  <Fade in timeout={500}>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        alignItems: "center",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        p: 3,
                      }}
                      action={
                        <IconButton size="small" onClick={() => setError(null)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Typography variant="h6" fontWeight={700}>Conversion Error</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{error}</Typography>
                    </Alert>
                  </Fade>
                )}

                {conversionResult && (
                  <Zoom in timeout={500}>
                    <Paper elevation={0} className="content-paper" sx={{ p: 5 }}>
                      {/* Success Header */}
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 4,
                        justifyContent: "center",
                        gap: 12,
                        flexDirection: { xs: "column", md: "row" },
                        textAlign: { xs: "center", md: "left" },
                      }}>
                        <Box sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#f0fdf4",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }} color="text.primary">
                            Conversion Successful
                          </Typography>
                          <Typography variant="h6" color="text.secondary">
                            Your PDF has been generated and downloaded automatically
                          </Typography>
                        </Box>
                      </Box>

                      {/* Details */}
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              FILE NAME
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                              <Typography fontWeight={700} color="text.primary">
                                {conversionResult.fileName}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(conversionResult.fileName)}
                                sx={{ color: "#667085" }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              STATUS
                            </Typography>
                            <Chip label="Success" color="success" sx={{ mt: 1, color: "#fff" }} />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              MESSAGE
                            </Typography>
                            <Typography sx={{ mt: 1 }} color="text.primary">
                              {conversionResult.message}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Typography
                        variant="body1"
                        sx={{ p: 3, borderRadius: 2, backgroundColor: "#f0f9ff" }}
                        color="text.secondary"
                      >
                        The PDF file has been automatically downloaded to your device. Check your downloads folder if you can't find it immediately.
                      </Typography>
                    </Paper>
                  </Zoom>
                )}

                {!loading && !conversionResult && !error && (
                  <Fade in timeout={800}>
                    <Paper elevation={0} className="content-paper" sx={{ p: 5, textAlign: "center" }}>
                      <InfoIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                        Ready when you are
                      </Typography>
                      <Typography color="text.secondary">
                        Select an XML file on the left and click “Convert to PDF”.
                      </Typography>
                    </Paper>
                  </Fade>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box component="footer" className="footer">
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" className="footer-text">
            © {new Date().getFullYear()} XML to PDF Converter • Built by Can Matik
          </Typography>
        </Container>
      </Box>
    </>
  );
}
