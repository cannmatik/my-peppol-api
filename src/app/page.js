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
  InputAdornment,
  IconButton,
  Fade,
  Zoom,
  Divider,
  useMediaQuery
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// DeepSeek tarzı modern açık tema
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#175cd3',
      light: '#4e86f7',
      dark: '#0e3a8a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#667085',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active": {
          WebkitBoxShadow: "0 0 0 1000px #ffffff inset",
          boxShadow: "0 0 0 1000px #ffffff inset",
          WebkitTextFillColor: "#101828 !important",
        },
        body: {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#101828',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #175cd3 0%, #4e86f7 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0e3a8a 0%, #175cd3 100%)',
          },
        },
        outlined: {
          borderColor: '#d0d5dd',
          '&:hover': {
            borderColor: '#175cd3',
            backgroundColor: 'rgba(23, 92, 211, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #f1f5f9',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#f8fafc',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              boxShadow: '0 0 0 3px rgba(23, 92, 211, 0.1)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          alignItems: 'center',
        },
        standardSuccess: {
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        },
        standardInfo: {
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fed7aa',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        outlined: {
          borderColor: '#e2e8f0',
          backgroundColor: '#f8fafc',
        },
      },
    },
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
  const [copied, setCopied] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemeID: formData.schemeID,
          participantID: formData.participantID,
          documentType: formData.documentType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSuggestionClick = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Result header'ını belirleme
  const getResultHeader = () => {
    if (!result) return null;

    // Document type belirtilmemişse
    if (!result.documentType) {
      if (result.matchType === 'alternative_schemes') {
        return {
          title: 'Participant Found with Alternative Schemes',
          icon: <InfoIcon sx={{ fontSize: 24 }} />,
          color: '#175cd3',
          bgColor: '#f0f9ff'
        };
      }
      return {
        title: 'Participant Found',
        icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
        color: '#059669',
        bgColor: '#f0fdf4'
      };
    }

    // Document type belirtilmişse
    if (result.supportsDocumentType) {
      return {
        title: 'Document Supported',
        icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
        color: '#059669',
        bgColor: '#f0fdf4'
      };
    } else {
      return {
        title: 'Document Not Supported',
        icon: <CancelIcon sx={{ fontSize: 24 }} />,
        color: '#dc2626',
        bgColor: '#fef2f2'
      };
    }
  };

  // Önerilen değerler
  const suggestions = {
    schemeID: [
      { value: "0208", label: "0208 (VAT)", description: "European VAT identification number" },
      { value: "0088", label: "0088 (GLN)", description: "Global Location Number" },
      { value: "9925", label: "9925 (Test)", description: "Test scheme" },
      { value: "9956", label: "9956 (OrgNr)", description: "Swedish organization number" }
    ],
    participantID: [
      { value: "0418159080", label: "0418159080", description: "Example VAT ID" },
      { value: "008874732PR00000000", label: "008874732PR00000000", description: "Example GLN" },
      { value: "9915:123456789", label: "9915:123456789", description: "Example with scheme" }
    ],
    documentType: [
      { value: "Invoice", label: "Invoice", description: "Commercial invoice" },
      { value: "CreditNote", label: "CreditNote", description: "Credit note" },
      { value: "ApplicationResponse", label: "ApplicationResponse", description: "Application response" },
      { value: "Order", label: "Order", description: "Purchase order" },
      { value: "Catalogue", label: "Catalogue", description: "Product catalogue" }
    ]
  };

  const QuickActionCard = ({ title, description, icon, onClick, color = "primary" }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid #e2e8f0',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: '#175cd3',
          boxShadow: '0 8px 25px rgba(23, 92, 211, 0.15)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 8,
              backgroundColor: color === 'primary' ? '#f0f9ff' : '#f8fafc',
              color: color === 'primary' ? '#175cd3' : '#667085',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  const resultHeader = getResultHeader();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.25rem' }}>
            Peppol Participant Check
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            by Can Matik
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Fade in timeout={800}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  background: 'linear-gradient(135deg, #101828 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Peppol Participant Validation
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: 600, 
                  mx: 'auto',
                  fontSize: '1.125rem',
                  fontWeight: 400
                }}
              >
                Validate Peppol participants and check document type support in real-time
              </Typography>
            </Box>
          </Fade>
        </Box>

        <Grid container spacing={4} direction={isMobile ? "column" : "row"}>
          {/* Form Section - Her zaman ilk sırada */}
          <Grid item xs={12} md={6} order={isMobile ? 1 : 1}>
            <Zoom in timeout={600}>
              <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0' }}>
                <Typography variant="h5" gutterBottom fontWeight={600} mb={3}>
                  Check Participant Details
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Scheme ID"
                    name="schemeID"
                    value={formData.schemeID}
                    onChange={handleChange}
                    placeholder="e.g., 0208"
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

                  <TextField
                    fullWidth
                    label="Document Type (Optional)"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    placeholder="e.g., Invoice"
                    margin="normal"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mt: 4, 
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                    endIcon={!loading && <ArrowForwardIcon />}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Validating...
                      </>
                    ) : (
                      'Validate Participant'
                    )}
                  </Button>
                </Box>

                {/* Quick Suggestions */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                    <LightbulbIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Quick Suggestions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" gutterBottom>
                        Scheme ID
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {suggestions.schemeID.slice(0, 2).map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick('schemeID', item.value)}
                            sx={{ justifyContent: 'flex-start' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" gutterBottom>
                        Participant ID
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {suggestions.participantID.slice(0, 2).map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick('participantID', item.value)}
                            sx={{ justifyContent: 'flex-start' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" gutterBottom>
                        Document Type
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {suggestions.documentType.slice(0, 2).map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick('documentType', item.value)}
                            sx={{ justifyContent: 'flex-start' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Zoom>
          </Grid>

          {/* Results Section - Her zaman ikinci sırada */}
          <Grid item xs={12} md={6} order={isMobile ? 2 : 2}>
            <Box sx={{ height: '100%', position: isMobile ? 'static' : 'sticky', top: 24 }}>
              {loading && (
                <Fade in timeout={500}>
                  <Paper elevation={0} sx={{ 
                    p: 6, 
                    textAlign: 'center', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    <CircularProgress size={48} color="primary" />
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                      Checking participant...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Searching in Peppol directory
                    </Typography>
                  </Paper>
                </Fade>
              )}

              {error && (
                <Fade in timeout={500}>
                  <Alert 
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                      <IconButton
                        size="small"
                        onClick={() => setError(null)}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <Typography variant="body1" fontWeight={600}>Error</Typography>
                    <Typography variant="body2">{error}</Typography>
                  </Alert>
                </Fade>
              )}

              {result && (
                <Zoom in timeout={500}>
                  <Card elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <CardContent sx={{ p: 4 }}>
                      {/* Header */}
                      {resultHeader && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 10,
                              backgroundColor: resultHeader.bgColor,
                              color: resultHeader.color,
                              mr: 2,
                            }}
                          >
                            {resultHeader.icon}
                          </Box>
                          <Box>
                            <Typography variant="h5" component="h2" fontWeight={700}>
                              {resultHeader.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {result.matchType}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Participant Details */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                            COMPANY NAME
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600} color="primary.main">
                              {result.companyName || 'Not available'}
                            </Typography>
                            {result.companyName && (
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(result.companyName)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                            PARTICIPANT ID
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {result.participantID}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(result.participantID)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                            SCHEME ID
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {result.schemeID}
                          </Typography>
                        </Grid>
                        
                        {result.documentType && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                              REQUESTED DOCUMENT TYPE
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {result.documentType}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* Document Types */}
                      {result.allDocumentTypes && result.allDocumentTypes.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.primary" display="block" gutterBottom fontWeight={600}>
                            Supported Document Types
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {result.allDocumentTypes.map((docType, index) => (
                              <Chip
                                key={index}
                                label={docType}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Message */}
                      <Alert 
                        severity={
                          result.supportsDocumentType === true ? "success" :
                          result.supportsDocumentType === false ? "error" :
                          result.matchType === 'alternative_schemes' ? "warning" : "info"
                        }
                        icon={false}
                        sx={{ 
                          mt: 2,
                          backgroundColor: 
                            result.supportsDocumentType === true ? '#f0fdf4' :
                            result.supportsDocumentType === false ? '#fef2f2' :
                            result.matchType === 'alternative_schemes' ? '#fffbeb' : '#f0f9ff',
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {result.message}
                        </Typography>
                      </Alert>

                      {/* Alternative Schemes */}
                      {result.alternativeSchemes && result.alternativeSchemes.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                            Alternative Schemes Found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Participant found with different schemes:
                          </Typography>
                          {result.alternativeSchemes.map((scheme, index) => (
                            <Card key={index} variant="outlined" sx={{ mt: 1.5, p: 2, backgroundColor: '#f8fafc' }}>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {scheme.scheme}:{scheme.participantId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {scheme.companyName}
                              </Typography>
                              {scheme.documentTypes && scheme.documentTypes.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" fontWeight={600} display="block">
                                    Supports:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {scheme.documentTypes.map((doc, idx) => (
                                      <Chip
                                        key={idx}
                                        label={doc}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Zoom>
              )}

              {/* Info Cards */}
              {!loading && !result && (
                <Fade in timeout={800}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <QuickActionCard
                        title="Participant Lookup"
                        description="Find Peppol participants by scheme and ID with real-time validation from the Peppol directory."
                        icon={<SearchIcon />}
                        onClick={() => {
                          setFormData({
                            schemeID: "0208",
                            participantID: "0418159080",
                            documentType: ""
                          });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <QuickActionCard
                        title="Document Support Check"
                        description="Verify which document types (Invoice, CreditNote, Order, etc.) the participant can receive."
                        icon={<InfoIcon />}
                        color="secondary"
                        onClick={() => {
                          setFormData({
                            schemeID: "0208",
                            participantID: "0418159080",
                            documentType: "Invoice"
                          });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Fade>
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
          borderTop: '1px solid #e2e8f0',
          py: 4,
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Peppol Participant Check • Built by Can Matik
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}