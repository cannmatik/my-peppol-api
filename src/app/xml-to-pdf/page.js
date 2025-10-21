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

export default function XmlToPdfPage() {
  const [xmlFile, setXmlFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);

  // File upload handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is XML
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError("Please select an XML file");
      return;
    }

    setXmlFile(file);
    setPreview(`Selected file: ${file.name}`);
    setError("");
    setConversionResult(null);
  };

  // PDF conversion API call
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
        throw new Error(errorData.error || "API error");
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-document.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      setConversionResult({
        success: true,
        message: "PDF successfully generated and downloaded",
        fileName: "converted-document.pdf"
      });
      setError("");

    } catch (err) {
      setError("PDF conversion error: " + err.message);
      setConversionResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Quick examples
  const fileExamples = [
    {
      name: "UBL Invoice",
      type: "INV",
      description: "Standard commercial invoice"
    },
    {
      name: "UBL Credit Note",
      type: "CN",
      description: "Credit note document"
    },
    {
      name: "UBL Order",
      type: "ORD",
      description: "Purchase order"
    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Container maxWidth="lg" className="main-container">
        {/* Header */}
        <Box textAlign="center" className="header-box">
          <Fade in timeout={800}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                className="main-title"
                sx={{ mb: 3 }}
              >
                XML to PDF Converter
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                className="subtitle"
                sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}
              >
                Convert UBL XML documents to professional PDF invoices with perfect formatting
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Main Content */}
        <Box className="centered-content">
          <Grid container spacing={4} justifyContent="center" className="main-grid-container">
            {/* Upload Section */}
            <Grid item xs={12} md={6} lg={5}>
              <Zoom in timeout={600}>
                <Paper elevation={0} className="form-paper" sx={{ p: 4 }}>
                  {/* File Upload Area */}
                  <Box className="upload-area" sx={{ py: 5, px: 3 }}>
                    <Box className="upload-icon-container" sx={{ mb: 3 }}>
                      <DescriptionIcon className="upload-icon" sx={{ fontSize: 64, color: '#175cd3', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={600} className="upload-title" sx={{ mb: 2, color: '#101828' }}>
                      Upload XML File
                    </Typography>
                    <Typography variant="body1" color="text.secondary" className="upload-description" sx={{ mb: 4, lineHeight: 1.6 }}>
                      Select your UBL XML document to convert to professional PDF format
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      className="upload-button"
                      sx={{ 
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        border: '2px dashed #e2e8f0',
                        '&:hover': {
                          border: '2px dashed #175cd3',
                          backgroundColor: '#f0f9ff'
                        }
                      }}
                    >
                      Choose XML File
                      <input
                        type="file"
                        accept=".xml"
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>

                    {preview && (
                      <Fade in timeout={300}>
                        <Box className="file-preview" sx={{ mt: 3, p: 2, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1 }} />
                          <Typography variant="body2" className="file-preview-text" sx={{ fontWeight: 500, color: '#059669' }}>
                            {preview}
                          </Typography>
                        </Box>
                      </Fade>
                    )}
                  </Box>

                  {/* Convert Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!xmlFile || loading}
                    onClick={handleConvert}
                    className="convert-button"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    sx={{ 
                      mt: 2,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #175cd3 0%, #4e86f7 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0e3a8a 0%, #175cd3 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(23, 92, 211, 0.3)'
                      },
                      '&:disabled': {
                        background: '#e2e8f0'
                      }
                    }}
                  >
                    {loading ? 'Converting...' : 'Convert to PDF'}
                  </Button>

                  {/* Quick Examples */}
                  <Box className="suggestions-box" sx={{ mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.primary" className="suggestions-title" sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <InfoIcon className="suggestion-icon" sx={{ fontSize: 20, mr: 1 }} />
                      Supported Document Types
                    </Typography>
                    <Grid container spacing={2} className="suggestions-grid">
                      {fileExamples.map((example, index) => (
                        <Grid item xs={12} sm={4} key={index}>
                          <Card 
                            variant="outlined" 
                            className="example-card"
                            sx={{ 
                              borderRadius: 3,
                              border: '1px solid #f1f5f9',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: '#175cd3',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(23, 92, 211, 0.1)'
                              }
                            }}
                          >
                            <CardContent className="example-card-content" sx={{ p: 3, textAlign: 'center' }}>
                              <Typography variant="body1" fontWeight={600} className="example-name" sx={{ mb: 1, color: '#101828' }}>
                                {example.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" className="example-description" sx={{ mb: 2, lineHeight: 1.4, fontSize: '0.875rem' }}>
                                {example.description}
                              </Typography>
                              <Chip
                                label={example.type}
                                size="small"
                                variant="filled"
                                color="primary"
                                className="example-chip"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  height: 24,
                                  background: 'linear-gradient(135deg, #175cd3 0%, #4e86f7 100%)',
                                  color: 'white'
                                }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Paper>
              </Zoom>
            </Grid>

            {/* Results Section */}
            <Grid item xs={12} md={6} lg={7}>
              <Box className="results-container" sx={{ minHeight: 600 }}>
                {loading && (
                  <Fade in timeout={500}>
                    <Paper elevation={0} className="loading-paper" sx={{ p: 8, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4 }}>
                      <CircularProgress size={80} color="primary" />
                      <Typography variant="h4" className="loading-title" sx={{ mt: 4, mb: 2, fontWeight: 600, color: '#101828' }}>
                        Converting XML to PDF...
                      </Typography>
                      <Typography variant="body1" color="text.secondary" className="loading-subtitle">
                        Processing your document and generating PDF
                      </Typography>
                    </Paper>
                  </Fade>
                )}

                {error && (
                  <Fade in timeout={500}>
                    <Alert 
                      severity="error"
                      className="error-alert"
                      sx={{ 
                        mb: 3,
                        borderRadius: 3,
                        alignItems: 'center',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        p: 3
                      }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => setError(null)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Typography variant="h6" fontWeight={600}>Conversion Error</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{error}</Typography>
                    </Alert>
                  </Fade>
                )}

                {conversionResult && (
                  <Zoom in timeout={500}>
                    <Card elevation={0} className="result-card" sx={{ border: '1px solid #e2e8f0', borderRadius: 4, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)', transform: 'translateY(-2px)' } }}>
                      <CardContent className="result-content" sx={{ p: 5 }}>
                        {/* Success Header */}
                        <Box className="result-header" sx={{ display: 'flex', alignItems: 'center', mb: 5, justifyContent: 'center', flexDirection: { xs: 'column', md: 'row' }, textAlign: { xs: 'center', md: 'left' }, gap: 3 }}>
                          <Box
                            className="success-icon-container"
                            sx={{
                              padding: 3,
                              borderRadius: 3,
                              backgroundColor: '#f0fdf4',
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 32 }} />
                          </Box>
                          <Box className="result-header-text" sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
                            <Typography variant="h3" component="h2" className="result-title" sx={{ fontWeight: 700, mb: 1, color: '#101828' }}>
                              Conversion Successful
                            </Typography>
                            <Typography variant="h6" color="text.secondary" className="result-subtitle" sx={{ fontWeight: 400 }}>
                              Your PDF has been generated and downloaded automatically
                            </Typography>
                          </Box>
                        </Box>

                        {/* Result Details */}
                        <Grid container spacing={3} className="details-grid" sx={{ mb: 5 }}>
                          <Grid item xs={12} sm={6}>
                            <Box className="detail-item" sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' }, gap: 1, p: 3, backgroundColor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                              <Typography variant="caption" color="text.secondary" className="detail-label" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                FILE NAME
                              </Typography>
                              <Box className="detail-value-container" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Typography variant="body1" fontWeight={600} className="detail-value" sx={{ fontSize: '1.1rem', color: '#101828' }}>
                                  {conversionResult.fileName}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => copyToClipboard(conversionResult.fileName)}
                                  className="copy-button"
                                  sx={{ color: '#667085', '&:hover': { color: '#175cd3', backgroundColor: '#f0f9ff' } }}
                                >
                                  <ContentCopyIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Box className="detail-item" sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' }, gap: 1, p: 3, backgroundColor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                              <Typography variant="caption" color="text.secondary" className="detail-label" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                STATUS
                              </Typography>
                              <Chip
                                label="Success"
                                color="success"
                                variant="filled"
                                size="medium"
                                sx={{ 
                                  fontWeight: 600,
                                  backgroundColor: '#059669',
                                  color: 'white',
                                  mt: 1
                                }}
                              />
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Box className="detail-item" sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' }, gap: 1, p: 3, backgroundColor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                              <Typography variant="caption" color="text.secondary" className="detail-label" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                MESSAGE
                              </Typography>
                              <Typography variant="body1" className="detail-value" sx={{ mt: 1, color: '#101828', fontSize: '1.1rem' }}>
                                {conversionResult.message}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Features */}
                        <Box className="document-types-box" sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
                          <Typography variant="h6" color="text.primary" className="document-types-title" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            PDF FEATURES
                          </Typography>
                          <Box className="features-chips" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                            {["Professional Layout", "A4 Format", "Tax Calculation", "Multi-page Support", "UBL Compliant", "Instant Download"].map((feature, index) => (
                              <Chip
                                key={index}
                                label={feature}
                                size="medium"
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 500,
                                  fontSize: '0.875rem',
                                  height: 36,
                                  borderColor: '#e2e8f0',
                                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: '#175cd3',
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        {/* Info Alert */}
                        <Alert 
                          severity="info"
                          icon={false}
                          sx={{ 
                            mt: 3,
                            p: 3,
                            borderRadius: 3,
                            border: 'none',
                            backgroundColor: '#f0f9ff',
                          }}
                        >
                          <Typography variant="body1" fontWeight={500} className="result-message" sx={{ textAlign: { xs: 'center', md: 'left' }, color: '#475569', lineHeight: 1.6 }}>
                            The PDF file has been automatically downloaded to your device. 
                            Check your downloads folder if you can't find it immediately.
                          </Typography>
                        </Alert>
                      </CardContent>
                    </Card>
                  </Zoom>
                )}

                {/* Info Cards - Only when no result */}
                {!loading && !conversionResult && !error && (
                  <Fade in timeout={800}>
                    <Grid container spacing={3} className="info-cards-container" sx={{ maxWidth: 600, mx: 'auto' }}>
                      <Grid item xs={12} md={6}>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card 
                          className="info-card"
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid #f1f5f9',
                            borderRadius: 4,
                            background: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            height: '100%',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              borderColor: '#175cd3',
                              boxShadow: '0 16px 40px rgba(23, 92, 211, 0.12)'
                            }
                          }}
                        >
                        </Card>
                      </Grid>
                    </Grid>
                  </Fade>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box component="footer" className="footer" sx={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', py: 4, mt: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center" className="footer-text">
            &copy; {new Date().getFullYear()} XML to PDF Converter • Built by Can Matik
          </Typography>
        </Container>
      </Box>
    </>
  );
}