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
import { theme } from "./theme";
import "./styles.css";

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

  const getResultHeader = () => {
    if (!result) return null;

    if (result.matchType === 'not_found') {
      return {
        title: 'Participant Not Found',
        icon: <CancelIcon sx={{ fontSize: 24 }} />,
        color: '#dc2626',
        bgColor: '#fef2f2'
      };
    }

    if (!result.documentType) {
      if (result.matchType === 'alternative_schemes') {
        return {
          title: 'Found with Alternative Schemes',
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

  const suggestions = {
    schemeID: [
      { value: "0208", label: "0208", description: "VAT identification" },
      { value: "0088", label: "0088", description: "GLN" },
      { value: "9925", label: "9925", description: "Test" },
      { value: "9956", label: "9956", description: "OrgNr" }
    ],
    participantID: [
      { value: "1009049626", label: "1009049626", description: "Example VAT" },
      { value: "008874732PR00000000", label: "008874732PR...", description: "Example GLN" }
    ],
    documentType: [
      { value: "Invoice", label: "Invoice", description: "Commercial invoice" },
      { value: "CreditNote", label: "CreditNote", description: "Credit note" },
      { value: "Order", label: "Order", description: "Purchase order" }
    ]
  };

  const resultHeader = getResultHeader();

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box textAlign="center" sx={{ mt: 4, mb: 4 }}>
        <Fade in timeout={800}>
          <Box>
            <Typography variant="h4" component="h1">
              Peppol Participant Validation
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 1.5, maxWidth: "600px", mx: "auto" }}
            >
              Validate participants and check document support
            </Typography>
          </Box>
        </Fade>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Grid container spacing={4} sx={{ maxWidth: "1000px" }}>
          <Grid item xs={12} md={5} lg={4}>
            <Zoom in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: `1px solid ${theme.palette.grey[200]}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 10px 25px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Scheme"
                      name="schemeID"
                      value={formData.schemeID}
                      onChange={handleChange}
                      placeholder="0208"
                      size="medium"
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
                      placeholder="1009049626"
                      size="medium"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Document Type (Optional)"
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleChange}
                      placeholder="Invoice"
                      size="medium"
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: "0.95rem",
                      mt: 1,
                      bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                      "&:hover": {
                        bgcolor: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px rgba(23, 92, 211, 0.3)`,
                      },
                      "&:active": { transform: "translateY(0)" },
                    }}
                    endIcon={!loading && <ArrowForwardIcon />}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />
                        Checking...
                      </>
                    ) : (
                      "Validate Participant"
                    )}
                  </Button>
                </Box>

                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.grey[100]}` }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <LightbulbIcon sx={{ fontSize: 16, mr: 1 }} />
                    Quick Fill Examples
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Scheme
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                        {suggestions.schemeID.map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick("schemeID", item.value)}
                            sx={{
                              borderColor: theme.palette.grey[200],
                              bgcolor: theme.palette.background.paper,
                              fontWeight: 500,
                              minWidth: "80px",
                              "&:hover": {
                                borderColor: theme.palette.primary.main,
                                bgcolor: theme.palette.primary.light,
                                transform: "translateY(-1px)",
                              },
                            }}
                            title={item.description}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Participant
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                        {suggestions.participantID.map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick("participantID", item.value)}
                            sx={{
                              borderColor: theme.palette.grey[200],
                              bgcolor: theme.palette.background.paper,
                              fontWeight: 500,
                              minWidth: "80px",
                              "&:hover": {
                                borderColor: theme.palette.primary.main,
                                bgcolor: theme.palette.primary.light,
                                transform: "translateY(-1px)",
                              },
                            }}
                            title={item.description}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Document Type
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                        {suggestions.documentType.map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick("documentType", item.value)}
                            sx={{
                              borderColor: theme.palette.grey[200],
                              bgcolor: theme.palette.background.paper,
                              fontWeight: 500,
                              minWidth: "80px",
                              "&:hover": {
                                borderColor: theme.palette.primary.main,
                                bgcolor: theme.palette.primary.light,
                                transform: "translateY(-1px)",
                              },
                            }}
                            title={item.description}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Zoom>
          </Grid>

          <Grid item xs={12} md={7} lg={8}>
            <Box sx={{ height: "100%", minHeight: "400px", display: "flex", flexDirection: "column" }}>
              {loading && (
                <Fade in timeout={500}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 4, sm: 6 },
                      textAlign: "center",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      border: `1px solid ${theme.palette.grey[200]}`,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.background.paper,
                    }}
                  >
                    <CircularProgress size={60} color="primary" />
                    <Typography variant="h5" sx={{ mt: 3, mb: 1, fontWeight: 600, color: theme.palette.text.primary }}>
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
                    action={<IconButton size="small" onClick={() => setError(null)}><CancelIcon fontSize="small" /></IconButton>}
                    sx={{
                      mb: 3,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: "#fef2f2",
                      color: "#dc2626",
                      border: `1px solid ${theme.palette.error.light}`,
                      p: 2,
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body1" fontWeight={600}>Error</Typography>
                    <Typography variant="body2">{error}</Typography>
                  </Alert>
                </Fade>
              )}

              {result && (
                <Zoom in timeout={500}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.grey[200]}`,
                      borderRadius: theme.shape.borderRadius,
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                      bgcolor: theme.palette.background.paper,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(0,0,0,0.05)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                      {resultHeader && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 4,
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: { xs: "center", sm: "flex-start" },
                            textAlign: { xs: "center", sm: "left" },
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: theme.shape.borderRadius,
                              bgcolor: resultHeader.bgColor,
                              color: resultHeader.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {resultHeader.icon}
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "center", sm: "flex-start" } }}>
                            <Typography variant="h4" component="h2" sx={{ mb: 0.5 }}>
                              {resultHeader.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {result.matchType}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Grid container spacing={3} sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: theme.shape.borderRadius, border: `1px solid ${theme.palette.grey[200]}` }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              COMPANY NAME
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, justifyContent: { xs: "center", md: "flex-start" } }}>
                              <Typography variant="h6" fontWeight={700} color="primary.main">
                                {result.companyName || "Not available"}
                              </Typography>
                              {result.companyName && (
                                <IconButton size="small" onClick={() => copyToClipboard(result.companyName)} sx={{ color: theme.palette.grey[600], "&:hover": { color: theme.palette.primary.main, bgcolor: theme.palette.primary.light } }}>
                                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: theme.shape.borderRadius, border: `1px solid ${theme.palette.grey[200]}` }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              PARTICIPANT ID
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, justifyContent: { xs: "center", md: "flex-start" } }}>
                              <Typography variant="body1" fontWeight={600}>
                                {result.participantID}
                              </Typography>
                              <IconButton size="small" onClick={() => copyToClipboard(result.participantID)} sx={{ color: theme.palette.grey[600], "&:hover": { color: theme.palette.primary.main, bgcolor: theme.palette.primary.light } }}>
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: theme.shape.borderRadius, border: `1px solid ${theme.palette.grey[200]}` }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              SCHEME ID
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {result.schemeID}
                            </Typography>
                          </Box>
                        </Grid>
                        {result.documentType && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: theme.shape.borderRadius, border: `1px solid ${theme.palette.grey[200]}` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                REQUESTED DOCUMENT TYPE
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {result.documentType}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {result.allDocumentTypes && result.allDocumentTypes.length > 0 && (
                        <Box sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
                          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            SUPPORTED DOCUMENT TYPES
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: { xs: "center", md: "flex-start" }, mt: 2 }}>
                            {result.allDocumentTypes.map((docType, index) => (
                              <Chip
                                key={index}
                                label={docType}
                                size="medium"
                                color="primary"
                                variant="outlined"
                                sx={{
                                  fontWeight: 500,
                                  borderColor: theme.palette.grey[200],
                                  bgcolor: theme.palette.grey[50],
                                  "&:hover": {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: theme.palette.primary.light,
                                    transform: "translateY(-1px)",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Alert
                        severity={
                          result.supportsDocumentType === true ? "success" :
                          result.supportsDocumentType === false ? "error" :
                          result.matchType === "alternative_schemes" ? "warning" : "info"
                        }
                        icon={false}
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: theme.shape.borderRadius,
                          bgcolor:
                            result.supportsDocumentType === true ? "#f0fdf4" :
                            result.supportsDocumentType === false ? "#fef2f2" :
                            result.matchType === "alternative_schemes" ? "#fffbeb" : "#f0f9ff",
                          textAlign: { xs: "center", md: "left" },
                        }}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {result.message}
                        </Typography>
                      </Alert>

                      {result.alternativeSchemes && result.alternativeSchemes.length > 0 && (
                        <Box sx={{ mt: 4, textAlign: { xs: "center", md: "left" } }}>
                          <Divider sx={{ my: 3, borderColor: theme.palette.grey[200] }} />
                          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                            ALTERNATIVE SCHEMES FOUND
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Participant found with different schemes:
                          </Typography>
                          <Grid container spacing={2}>
                            {result.alternativeSchemes.map((scheme, index) => (
                              <Grid item xs={12} md={6} key={index}>
                                <Card
                                  variant="outlined"
                                  sx={{
                                    p: 2,
                                    bgcolor: theme.palette.grey[50],
                                    borderRadius: theme.shape.borderRadius,
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      bgcolor: theme.palette.primary.light,
                                      borderColor: theme.palette.primary.main,
                                      transform: "translateY(-2px)",
                                    },
                                  }}
                                >
                                  <CardContent sx={{ textAlign: { xs: "center", md: "left" } }}>
                                    <Typography variant="body1" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                      {scheme.scheme}:{scheme.participantId}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {scheme.companyName}
                                    </Typography>
                                    {scheme.documentTypes && scheme.documentTypes.length > 0 && (
                                      <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="caption" fontWeight={600} sx={{ mb: 1 }}>
                                          Supports:
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                          {scheme.documentTypes.map((doc, idx) => (
                                            <Chip
                                              key={idx}
                                              label={doc}
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                fontSize: "0.65rem",
                                                height: "22px",
                                                borderColor: theme.palette.grey[200],
                                                bgcolor: theme.palette.background.paper,
                                              }}
                                            />
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Zoom>
              )}

              {!loading && !result && !error && (
                <Fade in timeout={800}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, maxWidth: "600px", mx: "auto" }}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        border: `1px solid ${theme.palette.grey[200]}`,
                        borderRadius: theme.shape.borderRadius,
                        bgcolor: theme.palette.background.paper,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: theme.palette.primary.main,
                          boxShadow: "0 16px 40px rgba(23, 92, 211, 0.12)",
                        },
                      }}
                      onClick={() => {
                        setFormData({
                          schemeID: "0208",
                          participantID: "1009049626",
                          documentType: "",
                        });
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, flexDirection: "column", gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: theme.shape.borderRadius,
                              bgcolor: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.grey[50]} 100%)`,
                              color: theme.palette.primary.main,
                            }}
                          >
                            <SearchIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography variant="h6" fontWeight={600}>
                            Quick Lookup
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Find participants by ID and scheme
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        border: `1px solid ${theme.palette.grey[200]}`,
                        borderRadius: theme.shape.borderRadius,
                        bgcolor: theme.palette.background.paper,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: theme.palette.primary.main,
                          boxShadow: "0 16px 40px rgba(23, 92, 211, 0.12)",
                        },
                      }}
                      onClick={() => {
                        setFormData({
                          schemeID: "0208",
                          participantID: "1009049626",
                          documentType: "Invoice",
                        });
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, flexDirection: "column", gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: theme.shape.borderRadius,
                              bgcolor: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            <InfoIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography variant="h6" fontWeight={600}>
                            Check Support
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Verify document type compatibility
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}