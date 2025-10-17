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
  ThemeProvider,
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

  // Result header'ını doğru şekilde belirleme - DÜZELTİLDİ
  const getResultHeader = () => {
    if (!result) return null;

    // Participant bulunamadıysa
    if (result.matchType === 'not_found') {
      return {
        title: 'Participant Not Found',
        icon: <CancelIcon sx={{ fontSize: 24 }} />,
        color: '#dc2626',
        bgColor: '#fef2f2'
      };
    }

    // Document type belirtilmemişse
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
    <>
      <Container maxWidth="lg" className="main-container">
        {/* Header */}
        <Box textAlign="center" className="header-box">
          <Fade in timeout={800}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                className="main-title"
              >
                Peppol Participant Validation
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                className="subtitle"
              >
                Validate participants and check document support
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Main Content - Centered */}
        <Box className="centered-content">
          <Grid container spacing={4} justifyContent="center" className="main-grid-container">
            {/* Form Section */}
            <Grid item xs={12} md={5} lg={4}>
              <Zoom in timeout={600}>
                <Paper elevation={0} className="form-paper">
                  <Box component="form" onSubmit={handleSubmit} className="form-container">
                    {/* Form Fields */}
                    <Box className="form-fields">
                      <TextField
                        fullWidth
                        label="Scheme"
                        name="schemeID"
                        value={formData.schemeID}
                        onChange={handleChange}
                        placeholder="0208"
                        size="medium"
                        required
                        className="form-field"
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
                        className="form-field"
                      />
                      
                      <TextField
                        fullWidth
                        label="Document Type (Optional)"
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        placeholder="Invoice"
                        size="medium"
                        className="form-field"
                      />
                    </Box>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      className="submit-button"
                      endIcon={!loading && <ArrowForwardIcon />}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} color="inherit" className="button-spinner" />
                          Checking...
                        </>
                      ) : (
                        'Validate Participant'
                      )}
                    </Button>
                  </Box>

                  {/* Quick Suggestions */}
                  <Box className="suggestions-box">
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary" className="suggestions-title">
                      <LightbulbIcon className="suggestion-icon" />
                      Quick Fill Examples
                    </Typography>
                    <Box className="suggestions-grid">
                      <Box className="suggestion-category-box">
                        <Typography variant="caption" fontWeight={600} color="text.secondary" className="suggestion-category">
                          Scheme
                        </Typography>
                        <Box className="suggestion-chips">
                          {suggestions.schemeID.map((item, index) => (
                            <Chip
                              key={index}
                              label={item.label}
                              size="small"
                              variant="outlined"
                              onClick={() => handleSuggestionClick('schemeID', item.value)}
                              className="suggestion-chip"
                              title={item.description}
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box className="suggestion-category-box">
                        <Typography variant="caption" fontWeight={600} color="text.secondary" className="suggestion-category">
                          Participant
                        </Typography>
                        <Box className="suggestion-chips">
                          {suggestions.participantID.map((item, index) => (
                            <Chip
                              key={index}
                              label={item.label}
                              size="small"
                              variant="outlined"
                              onClick={() => handleSuggestionClick('participantID', item.value)}
                              className="suggestion-chip"
                              title={item.description}
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box className="suggestion-category-box">
                        <Typography variant="caption" fontWeight={600} color="text.secondary" className="suggestion-category">
                          Document Type
                        </Typography>
                        <Box className="suggestion-chips">
                          {suggestions.documentType.map((item, index) => (
                            <Chip
                              key={index}
                              label={item.label}
                              size="small"
                              variant="outlined"
                              onClick={() => handleSuggestionClick('documentType', item.value)}
                              className="suggestion-chip"
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

            {/* Results Section */}
            <Grid item xs={12} md={7} lg={8}>
              <Box className="results-container">
                {loading && (
                  <Fade in timeout={500}>
                    <Paper elevation={0} className="loading-paper">
                      <CircularProgress size={60} color="primary" />
                      <Typography variant="h5" className="loading-title">
                        Checking participant...
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="loading-subtitle">
                        Searching in Peppol directory
                      </Typography>
                    </Paper>
                  </Fade>
                )}

                {error && (
                  <Fade in timeout={500}>
                    <Alert 
                      severity="error"
                      className="error-alert"
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
                    <Card elevation={0} className="result-card">
                      <CardContent className="result-content">
                        {/* Header */}
                        {resultHeader && (
                          <Box className="result-header">
                            <Box
                              className="result-icon-container"
                              sx={{
                                backgroundColor: resultHeader.bgColor,
                                color: resultHeader.color,
                              }}
                            >
                              {resultHeader.icon}
                            </Box>
                            <Box className="result-header-text">
                              <Typography variant="h4" component="h2" className="result-title">
                                {resultHeader.title}
                              </Typography>
                              <Typography variant="body1" color="text.secondary" className="result-subtitle">
                                {result.matchType}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Participant Details */}
                        <Grid container spacing={4} className="details-grid">
                          <Grid item xs={12} sm={6} md={4}>
                            <Box className="detail-item">
                              <Typography variant="caption" color="text.secondary" className="detail-label">
                                COMPANY NAME
                              </Typography>
                              <Box className="detail-value-container">
                                <Typography variant="h6" fontWeight={700} color="primary.main" className="detail-value">
                                  {result.companyName || 'Not available'}
                                </Typography>
                                {result.companyName && (
                                  <IconButton 
                                    size="small" 
                                    onClick={() => copyToClipboard(result.companyName)}
                                    className="copy-button"
                                  >
                                    <ContentCopyIcon className="copy-icon" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box className="detail-item">
                              <Typography variant="caption" color="text.secondary" className="detail-label">
                                PARTICIPANT ID
                              </Typography>
                              <Box className="detail-value-container">
                                <Typography variant="body1" fontWeight={600} className="detail-value">
                                  {result.participantID}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => copyToClipboard(result.participantID)}
                                  className="copy-button"
                                >
                                  <ContentCopyIcon className="copy-icon" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box className="detail-item">
                              <Typography variant="caption" color="text.secondary" className="detail-label">
                                SCHEME ID
                              </Typography>
                              <Typography variant="body1" fontWeight={600} className="detail-value">
                                {result.schemeID}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {result.documentType && (
                            <Grid item xs={12}>
                              <Box className="detail-item">
                                <Typography variant="caption" color="text.secondary" className="detail-label">
                                  REQUESTED DOCUMENT TYPE
                                </Typography>
                                <Typography variant="body1" fontWeight={600} className="detail-value">
                                  {result.documentType}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>

                        {/* Document Types */}
                        {result.allDocumentTypes && result.allDocumentTypes.length > 0 && (
                          <Box className="document-types-box">
                            <Typography variant="subtitle1" color="text.primary" className="document-types-title">
                              SUPPORTED DOCUMENT TYPES
                            </Typography>
                            <Box className="document-chips">
                              {result.allDocumentTypes.map((docType, index) => (
                                <Chip
                                  key={index}
                                  label={docType}
                                  size="medium"
                                  color="primary"
                                  variant="outlined"
                                  className="document-chip"
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
                          className="result-message-alert"
                          sx={{ 
                            backgroundColor: 
                              result.supportsDocumentType === true ? '#f0fdf4' :
                              result.supportsDocumentType === false ? '#fef2f2' :
                              result.matchType === 'alternative_schemes' ? '#fffbeb' : '#f0f9ff',
                          }}
                        >
                          <Typography variant="body1" fontWeight={500} className="result-message">
                            {result.message}
                          </Typography>
                        </Alert>

                        {/* Alternative Schemes */}
                        {result.alternativeSchemes && result.alternativeSchemes.length > 0 && (
                          <Box className="alternative-schemes-box">
                            <Divider className="schemes-divider" />
                            <Typography variant="h6" className="schemes-title">
                              ALTERNATIVE SCHEMES FOUND
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="schemes-description">
                              Participant found with different schemes:
                            </Typography>
                            <Grid container spacing={2} className="schemes-grid">
                              {result.alternativeSchemes.map((scheme, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                  <Card variant="outlined" className="scheme-card">
                                    <CardContent className="scheme-card-content">
                                      <Typography variant="body1" fontWeight={700} color="primary.main" className="scheme-id">
                                        {scheme.scheme}:{scheme.participantId}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" className="scheme-company">
                                        {scheme.companyName}
                                      </Typography>
                                      {scheme.documentTypes && scheme.documentTypes.length > 0 && (
                                        <Box className="scheme-documents">
                                          <Typography variant="caption" fontWeight={600} className="scheme-docs-title">
                                            Supports:
                                          </Typography>
                                          <Box className="scheme-doc-chips">
                                            {scheme.documentTypes.map((doc, idx) => (
                                              <Chip
                                                key={idx}
                                                label={doc}
                                                size="small"
                                                variant="outlined"
                                                className="scheme-doc-chip"
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

                {/* Info Cards - Only when no result */}
                {!loading && !result && !error && (
                  <Fade in timeout={800}>
                    <Box className="info-cards-container">
                      <Card 
                        className="info-card"
                        onClick={() => {
                          setFormData({
                            schemeID: "0208",
                            participantID: "1009049626",
                            documentType: ""
                          });
                        }}
                      >
                        <CardContent className="info-card-content">
                          <Box className="info-card-header">
                            <Box className="info-card-icon info-card-icon-primary">
                              <SearchIcon className="info-card-icon-svg" />
                            </Box>
                            <Typography variant="h6" fontWeight={600} className="info-card-title">
                              Quick Lookup
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" className="info-card-description">
                            Find participants by ID and scheme
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card 
                        className="info-card"
                        onClick={() => {
                          setFormData({
                            schemeID: "0208",
                            participantID: "1009049626",
                            documentType: "Invoice"
                          });
                        }}
                      >
                        <CardContent className="info-card-content">
                          <Box className="info-card-header">
                            <Box className="info-card-icon info-card-icon-secondary">
                              <InfoIcon className="info-card-icon-svg" />
                            </Box>
                            <Typography variant="h6" fontWeight={600} className="info-card-title">
                              Check Support
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" className="info-card-description">
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

      {/* Footer */}
      <Box component="footer" className="footer">
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center" className="footer-text">
            &copy; {new Date().getFullYear()} Peppol Participant Check • Built by Can Matik
          </Typography>
        </Container>
      </Box>
    </>
  );
}