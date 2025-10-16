"use client";
import { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

// Peppol temalı siyah-beyaz-mavi tema
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0033a0', // Peppol mavisi
      contrastText: '#ffffff',
    },

    secondary: {
      main: '#000000', // Siyah
    },

    background: {
      default: '#f4f6f8', // Daha yumuşak bir arka plan
      paper: '#ffffff',
    },

    text: {
      primary: '#1a1a1a', // Daha koyu metin
      secondary: '#666666',
    },

  },

  typography: {
    fontFamily: '"Inter", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#0033a0', // Başlıkları Peppol mavisi yap
    },

    h6: {
      fontWeight: 600,
    },

  },

  components: {
    // 2. Autofill Fix: Input arka planını düzelt
    MuiCssBaseline: {
        styleOverrides: {
          // Bu stil, tarayıcıların otomatik doldurma sırasında arka planı gri yapmasını engeller
          "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active": {
            WebkitBoxShadow: "0 0 0 1000px #ffffff inset", // Beyaz arka planı zorla
            boxShadow: "0 0 0 1000px #ffffff inset", // Standart
            WebkitTextFillColor: "#1a1a1a !important", // Metin rengini koru
          },

        },

      },

    MuiButton: {
      defaultProps: {
        disableElevation: true, // Düğmelerde varsayılan gölgeyi kaldır
      },

      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10, // Biraz daha yuvarlak
          fontWeight: 600,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
          },

        },

      },

    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Daha yuvarlak kartlar
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', // Daha belirgin ama yumuşak gölge
          transition: 'box-shadow 0.3s, transform 0.3s',
          '&:hover': {
             // Opsiyonel: Bilgi kartlarına zarif bir hover efekti
             transform: 'translateY(-2px)', 
             boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
          }
        },

      },

    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },

        },

      },

    },

    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 16,
            }
        }
    }
  },

});

export default function Home() {
  const [formData, setFormData] = useState({
    schemeID: "",
    participantID: "",
    documentType: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // API call placeholder
      // const response = await fetch('/api/check-participant', {...});
      // const data = await response.json();
      
      // Simulating a successful API response
      const data = {
        schemeID: formData.schemeID || "0208",
        participantID: formData.participantID || "0418159080",
        documentType: formData.documentType || "Invoice",
        supportsDocumentType: true,
        companyName: "Example Company AB",
        matchType: "Exact",
        message: "Participant found and supports the requested document type.",
        allDocumentTypes: ["Invoice", "CreditNote", "Order", "Catalogue"],
        alternativeSchemes: [
          { scheme: "9901", participantId: "9901:123456789", companyName: "Example Company AB (9901)", documentTypes: ["Invoice"] }
        ]
      }


      // Simulating an error response (for testing)
      // if (formData.participantID === "error") {
      //   throw new Error("Invalid Participant ID format.");
      // }
      
      // if (!response.ok) {
      //   throw new Error(data.error || 'API error occurred');
      // }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }


  // Önerilen değerler
  const suggestions = {
    schemeID: ["0208", "0088", "9925", "9956"],
    participantID: ["0418159080", "008874732PR00000000", "9915:123456789"],
    documentType: ["Invoice", "CreditNote", "ApplicationResponse", "Order", "Catalogue"]
  }


  const renderSuggestions = (type) => (
    // 1. Centering the suggestions
    <Typography 
      variant="caption" 
      color="text.secondary" 
      sx={{ display: 'block', mt: 0.5, mb: 1.5, textAlign: 'center' }} 
    >
      Suggestions: {suggestions[type].join(", ")}
    </Typography>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Peppol Participant Check
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            by Can Matik
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            Peppol Participant Validation
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Validate Peppol participants and check document type support in real-time using the Peppol directory.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Form Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={4} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="text.primary" align="center" mb={3}>
                Check Participant Details
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Scheme ID"
                  name="schemeID"
                  value={formData.schemeID}
                  onChange={handleChange}
                  placeholder="e.g., 0208 (VAT), 0088 (GLN)"
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                {renderSuggestions("schemeID")}

                <TextField
                  fullWidth
                  label="Participant ID"
                  name="participantID"
                  value={formData.participantID}
                  onChange={handleChange}
                  placeholder="e.g., 0418159080"
                  margin="normal"
                  required
                />
                {renderSuggestions("participantID")}

                <TextField
                  fullWidth
                  label="Document Type (Optional)"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  placeholder="e.g., Invoice, CreditNote"
                  margin="normal"
                />
                {renderSuggestions("documentType")}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 4, py: 1.7 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Search & Validate'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%' }}>
                {loading && (
                <Paper elevation={4} sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <CircularProgress size={40} color="primary" />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                    Checking participant...
                    </Typography>
                </Paper>
                )}

                {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight="medium">Error</Typography>
                    <Typography variant="body2">{error}</Typography>
                </Alert>
                )}

                {result && (
                <Card elevation={4}>
                    <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        {result.supportsDocumentType ? (
                        <CheckCircleIcon color="success" sx={{ mr: 1.5, fontSize: 30 }} />
                        ) : (
                        <CancelIcon color="error" sx={{ mr: 1.5, fontSize: 30 }} />
                        )}
                        <Typography variant="h5" component="h2" fontWeight="700" color="text.primary">
                        {result.supportsDocumentType ? 'Validation Successful' : 'Document Not Supported'}
                        </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Company Name
                        </Typography>
                        <Typography variant="body1" fontWeight="600" color="primary.main">
                            {result.companyName || 'N/A'}
                        </Typography>
                        </Grid>
                        <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Participant ID
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {result.participantID}
                        </Typography>
                        </Grid>
                        <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Scheme ID
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {result.schemeID}
                        </Typography>
                        </Grid>
                        <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Document Type
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {result.documentType || 'All'}
                        </Typography>
                        </Grid>
                        <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Match Type
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {result.matchType}
                        </Typography>
                        </Grid>
                    </Grid>

                    {result.allDocumentTypes && result.allDocumentTypes.length > 0 && (
                        <Box sx={{ mb: 3, pt: 1, borderTop: '1px solid #eee' }}>
                        <Typography variant="subtitle2" color="text.primary" display="block" gutterBottom fontWeight="600">
                            Supported Document Types
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {result.allDocumentTypes.map((docType, index) => (
                            <Chip
                                key={index}
                                label={docType}
                                size="medium"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                            />
                            ))}
                        </Box>
                        </Box>
                    )}

                    <Alert 
                        severity={result.supportsDocumentType ? "success" : "error"}
                        sx={{ mt: 2, borderRadius: 2 }}
                    >
                        {result.message}
                    </Alert>

                    {result.alternativeSchemes && result.alternativeSchemes.length > 0 && (
                        <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="600">
                            Alternative Schemes Found:
                        </Typography>
                        {result.alternativeSchemes.map((scheme, index) => (
                            <Card key={index} variant="outlined" sx={{ mt: 1.5, p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2" fontWeight="700">
                                {scheme.scheme}:{scheme.participantId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {scheme.companyName}
                            </Typography>
                            {scheme.documentTypes && (
                                <Typography variant="caption" display="block">
                                Supports: {scheme.documentTypes.join(', ')}
                                </Typography>
                            )}
                            </Card>
                        ))}
                        </Box>
                    )}
                    </CardContent>
                </Card>
                )}

                {/* Info Cards */}
                {!loading && !result && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                    <Card elevation={2}>
                        <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            🔍 Participant Lookup
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Find Peppol participants by scheme and ID with real-time validation from the Peppol directory. Essential for ensuring correct routing.
                        </Typography>
                        </CardContent>
                    </Card>
                    </Grid>
                    <Grid item xs={12}>
                    <Card elevation={2}>
                        <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            📄 Document Support
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Check which specific document types (Invoice, CreditNote, Order, etc.) the participant is configured to receive, streamlining your e-invoicing process.
                        </Typography>
                        </CardContent>
                    </Card>
                    </Grid>
                </Grid>
                )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: 4,
          mt: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Peppol Participant Check API • by Can Matik
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}