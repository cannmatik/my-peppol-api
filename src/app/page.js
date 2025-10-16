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
      default: '#ffffff',
      paper: '#fafafa',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API error occurred');
      }

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

  // Önerilen değerler
  const suggestions = {
    schemeID: ["0208", "0088", "9901", "9956"],
    participantID: ["0418159080", "008874732PR00000000", "9915:123456789"],
    documentType: ["Invoice", "CreditNote", "ApplicationResponse", "Order", "Catalogue"]
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Peppol Participant Check
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            by Can Matik
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h4" component="h1" gutterBottom color="text.primary">
            Peppol Participant Validation
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Validate Peppol participants and check document type support in real-time
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Form Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Check Participant
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Scheme ID"
                  name="schemeID"
                  value={formData.schemeID}
                  onChange={handleChange}
                  placeholder="e.g., 0208, 0088, 9956"
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Öneriler: {suggestions.schemeID.join(", ")}
                </Typography>

                <TextField
                  fullWidth
                  label="Participant ID"
                  name="participantID"
                  value={formData.participantID}
                  onChange={handleChange}
                  placeholder="e.g., 0418159080, 008874732PR00000000"
                  margin="normal"
                  required
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Öneriler: {suggestions.participantID.join(", ")}
                </Typography>

                <TextField
                  fullWidth
                  label="Document Type (Optional)"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  placeholder="e.g., Invoice, CreditNote, ApplicationResponse"
                  margin="normal"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Öneriler: {suggestions.documentType.join(", ")}
                </Typography>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Check Participant'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            {loading && (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Checking participant...
                </Typography>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {result && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {result.supportsDocumentType ? (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6" component="h2">
                      {result.supportsDocumentType ? 'Supported' : 'Not Supported'}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Participant ID
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {result.participantID}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Scheme ID
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {result.schemeID}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Company Name
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {result.companyName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Document Type
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {result.documentType || 'All'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Match Type
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {result.matchType}
                      </Typography>
                    </Grid>
                  </Grid>

                  {result.allDocumentTypes && result.allDocumentTypes.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Supported Document Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {result.allDocumentTypes.map((docType, index) => (
                          <Chip
                            key={index}
                            label={docType}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Alert 
                    severity={result.supportsDocumentType ? "success" : "error"}
                    sx={{ mt: 2 }}
                  >
                    {result.message}
                  </Alert>

                  {result.alternativeSchemes && result.alternativeSchemes.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom color="text.primary">
                        Alternative Schemes Found:
                      </Typography>
                      {result.alternativeSchemes.map((scheme, index) => (
                        <Card key={index} variant="outlined" sx={{ mt: 1, p: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {scheme.scheme}:{scheme.participantId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="text.primary">
                        🔍 Participant Lookup
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Find Peppol participants by scheme and ID with real-time validation from the Peppol directory.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="text.primary">
                        📄 Document Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check which document types (Invoice, CreditNote, ApplicationResponse, etc.) are supported by the participant.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="text.primary">
                        🌐 Multi-Scheme Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Automatic detection of alternative identification schemes and cross-referencing between different formats.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
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
          py: 3,
          mt: 4
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Peppol Participant Check API • by Can Matik
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}