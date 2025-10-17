"use client";
import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  ThemeProvider,
  CssBaseline,
  Fade,
  Zoom,
  Divider,
  Button,
  Alert,
  Tabs,
  Tab,
  useMediaQuery
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CodeIcon from "@mui/icons-material/Code";
import ApiIcon from "@mui/icons-material/Api";
import DescriptionIcon from "@mui/icons-material/Description";
import { theme } from "../theme";
import "./api-docs.css";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ApiDocs() {
  const [tabValue, setTabValue] = useState(0);
  const [copiedCode, setCopiedCode] = useState("");

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  // Request examples
  const requestExamples = {
    basic: {
      title: "Basic Validation",
      description: "Check if a participant exists",
      code: `{
  "schemeID": "0208",
  "participantID": "1009049626"
}`
    },
    withDocument: {
      title: "Document Support Check",
      description: "Check if participant supports a specific document type",
      code: `{
  "schemeID": "0208",
  "participantID": "1009049626",
  "documentType": "Invoice"
}`
    },
    gln: {
      title: "GLN Scheme",
      description: "Validate a participant with GLN scheme",
      code: `{
  "schemeID": "0088",
  "participantID": "008874732PR00000000"
}`
    }
  };

  // Response examples
  const responseExamples = {
    found: {
      title: "Participant Found",
      description: "Participant exists and supports the document type",
      code: `{
  "participantID": "1009049626",
  "schemeID": "0208",
  "documentType": "Invoice",
  "companyName": "Example Company AS",
  "supportsDocumentType": true,
  "matchType": "direct",
  "foundIn": "neon_database",
  "message": "✅ Invoice supported - Example Company AS",
  "allDocumentTypes": ["Invoice", "CreditNote", "Order"],
  "actualFullPid": "0208:1009049626"
}`
    },
    notFound: {
      title: "Participant Not Found",
      description: "Participant not found with requested scheme",
      code: `{
  "participantID": "1009049626",
  "schemeID": "0088",
  "documentType": "Invoice",
  "companyName": null,
  "supportsDocumentType": false,
  "matchType": "not_found",
  "foundIn": "none",
  "message": "❌ Participant not found with scheme 0088",
  "allDocumentTypes": [],
  "alternativeSchemes": [
    {
      "scheme": "0208",
      "participantId": "1009049626",
      "companyName": "Example Company AS",
      "documentTypes": ["Invoice", "CreditNote"]
    }
  ],
  "note": "Participant not found with requested scheme, but potential matches found in directory."
}`
    },
    alternative: {
      title: "Alternative Schemes Found",
      description: "Participant found with different schemes",
      code: `{
  "participantID": "1009049626",
  "schemeID": "0088",
  "documentType": "Invoice",
  "companyName": "Example Company AS",
  "supportsDocumentType": false,
  "matchType": "alternative_schemes",
  "foundIn": "neon_database",
  "message": "⚠️ Participant not found with scheme 0088, but found with alternative schemes",
  "allDocumentTypes": [],
  "alternativeSchemes": [
    {
      "scheme": "0208",
      "participantId": "1009049626",
      "fullId": "0208:1009049626",
      "companyName": "Example Company AS",
      "documentTypes": ["Invoice", "CreditNote", "Order"],
      "countryCode": "BE"
    }
  ],
  "note": "Participant found with alternative schemes. Try using one of the schemes below."
}`
    }
  };

  // Common values
  const commonSchemes = [
    { id: "0208", name: "VAT identification number", example: "1009049626" },
    { id: "0088", name: "GLN (Global Location Number)", example: "008874732PR00000000" },
    { id: "9925", name: "Test participants", example: "9908:123456789" },
    { id: "9956", name: "Organization number", example: "123456789" },
    { id: "0106", name: "SIRET (France)", example: "12345678901234" },
    { id: "0210", name: "NL SBR", example: "123456789" }
  ];

  const commonDocumentTypes = [
    "Invoice",
    "CreditNote", 
    "Order",
    "OrderResponse",
    "Catalogue",
    "DispatchAdvice",
    "ApplicationResponse",
    "PriceList",
    "Statement"
  ];

  return (
    <>
      <Container maxWidth="lg" className="api-docs-container">
        {/* Header */}
        <Box textAlign="center" className="api-header-box">
          <Fade in timeout={800}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                className="api-main-title"
              >
                API Documentation
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                className="api-subtitle"
              >
                Integrate Peppol participant validation into your applications
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Quick Start Card */}
        <Zoom in timeout={600}>
          <Card className="quick-start-card">
            <CardContent className="quick-start-content">
              <Box className="quick-start-header">
                <ApiIcon className="quick-start-icon" />
                <Box>
                  <Typography variant="h5" className="quick-start-title">
                    Quick Start
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Base URL: <code>https://peppolchecker.online/api</code>
                  </Typography>
                </Box>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body2">
                  <strong>No API key required</strong> - For limited time this API is free to use for Peppol participant validation.
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📍 Endpoint
                  </Typography>
                  <Box className="endpoint-box">
                    <Typography variant="body2" className="endpoint-method">
                      POST
                    </Typography>
                    <Typography variant="body1" className="endpoint-url">
                      /check-participant
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    ⚡ Usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Simply send a POST request with the participant details to validate and check document support.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Zoom>

        {/* Main Content */}
        <Grid container spacing={4} className="api-main-grid">
          {/* Left Sidebar - Navigation */}
          <Grid item xs={12} lg={3}>
            <Paper elevation={0} className="sidebar-paper">
              <Typography variant="h6" gutterBottom className="sidebar-title">
                Documentation
              </Typography>
              <Box className="sidebar-nav">
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 0 ? 'active' : ''}`}
                  onClick={() => setTabValue(0)}
                  startIcon={<DescriptionIcon />}
                >
                  Overview
                </Button>
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 1 ? 'active' : ''}`}
                  onClick={() => setTabValue(1)}
                  startIcon={<CodeIcon />}
                >
                  Request Format
                </Button>
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 2 ? 'active' : ''}`}
                  onClick={() => setTabValue(2)}
                  startIcon={<ApiIcon />}
                >
                  Response Format
                </Button>
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 3 ? 'active' : ''}`}
                  onClick={() => setTabValue(3)}
                  startIcon={<CheckIcon />}
                >
                  Examples
                </Button>
              </Box>

              {/* Common Values */}
              <Box className="common-values-box">
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                  Common Scheme IDs
                </Typography>
                <Box className="common-chips">
                  {commonSchemes.map((scheme) => (
                    <Chip
                      key={scheme.id}
                      label={scheme.id}
                      size="small"
                      variant="outlined"
                      className="common-chip"
                      title={`${scheme.name} (Example: ${scheme.example})`}
                    />
                  ))}
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                  Common Document Types
                </Typography>
                <Box className="common-chips">
                  {commonDocumentTypes.map((docType) => (
                    <Chip
                      key={docType}
                      label={docType}
                      size="small"
                      variant="outlined"
                      className="common-chip"
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} lg={9}>
            <Paper elevation={0} className="content-paper">
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                className="api-tabs"
                variant={isMobile ? "scrollable" : "standard"}
              >
                <Tab label="Overview" />
                <Tab label="Request Format" />
                <Tab label="Response Format" />
                <Tab label="Examples" />
              </Tabs>

              <Divider />

              {/* Overview Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h4" gutterBottom className="section-title">
                  API Overview
                </Typography>
                
                <Typography variant="body1" paragraph>
                  The Peppol Participant Check API provides real-time validation of Peppol participants 
                  and document type support. It queries both the official Peppol directory and our 
                  enhanced database to deliver comprehensive validation results.
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          🔍 Participant Validation
                        </Typography>
                        <Typography variant="body2">
                          Verify if a participant exists in the Peppol network using their scheme and identifier.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          📄 Document Support
                        </Typography>
                        <Typography variant="body2">
                          Check which document types a participant supports (Invoice, CreditNote, Order, etc.).
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          🔄 Alternative Schemes
                        </Typography>
                        <Typography variant="body2">
                          Discover alternative identification schemes for the same participant.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          ⚡ Real-time Results
                        </Typography>
                        <Typography variant="body2">
                          Get instant validation results with comprehensive participant information.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Request Format Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h4" gutterBottom className="section-title">
                  Request Format
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Send a POST request to <code>/api/check-participant</code> with JSON payload.
                </Alert>

                <Box className="request-schema">
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Request Body Schema
                  </Typography>
                  
                  <Card variant="outlined" className="schema-card">
                    <CardContent>
                      <Box className="schema-field">
                        <Typography variant="subtitle1" className="field-name">
                          schemeID
                        </Typography>
                        <Chip label="required" size="small" color="error" variant="outlined" />
                        <Typography variant="body2" color="text.secondary">
                          string - Participant identification scheme
                        </Typography>
                      </Box>
                      
                      <Box className="schema-field">
                        <Typography variant="subtitle1" className="field-name">
                          participantID
                        </Typography>
                        <Chip label="required" size="small" color="error" variant="outlined" />
                        <Typography variant="body2" color="text.secondary">
                          string - Participant identifier
                        </Typography>
                      </Box>
                      
                      <Box className="schema-field">
                        <Typography variant="subtitle1" className="field-name">
                          documentType
                        </Typography>
                        <Chip label="optional" size="small" variant="outlined" />
                        <Typography variant="body2" color="text.secondary">
                          string - Document type to check support for
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Box className="code-example-box" sx={{ mt: 4 }}>
                  <Box className="code-header">
                    <Typography variant="h6">
                      Example Request
                    </Typography>
                    <Button
                      size="small"
                      startIcon={copiedCode === 'basic-request' ? <CheckIcon /> : <ContentCopyIcon />}
                      onClick={() => copyToClipboard(requestExamples.basic.code, 'basic-request')}
                    >
                      {copiedCode === 'basic-request' ? 'Copied!' : 'Copy'}
                    </Button>
                  </Box>
                  <Paper variant="outlined" className="code-paper">
                    <pre className="code-block">
                      {`POST /api/check-participant\nContent-Type: application/json\n\n${requestExamples.basic.code}`}
                    </pre>
                  </Paper>
                </Box>
              </TabPanel>

              {/* Response Format Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h4" gutterBottom className="section-title">
                  Response Format
                </Typography>

                <Box className="response-schema">
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Response Body Schema
                  </Typography>
                  
                  <Card variant="outlined" className="schema-card">
                    <CardContent>
                      {[
                        { name: 'participantID', type: 'string', desc: 'The participant ID from request' },
                        { name: 'schemeID', type: 'string', desc: 'The scheme ID from request' },
                        { name: 'documentType', type: 'string | null', desc: 'Requested document type' },
                        { name: 'companyName', type: 'string | null', desc: 'Participant company name' },
                        { name: 'supportsDocumentType', type: 'boolean | null', desc: 'Document type support status' },
                        { name: 'matchType', type: 'string', desc: 'How the participant was matched' },
                        { name: 'foundIn', type: 'string', desc: 'Data source where participant was found' },
                        { name: 'message', type: 'string', desc: 'Human-readable result message' },
                        { name: 'allDocumentTypes', type: 'string[]', desc: 'All supported document types' },
                        { name: 'actualFullPid', type: 'string', desc: 'Full participant identifier' },
                        { name: 'alternativeSchemes', type: 'array | null', desc: 'Alternative scheme matches' },
                        { name: 'note', type: 'string | null', desc: 'Additional information' }
                      ].map((field) => (
                        <Box key={field.name} className="schema-field">
                          <Typography variant="subtitle1" className="field-name">
                            {field.name}
                          </Typography>
                          <Chip 
                            label={field.type} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontFamily: 'monospace' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {field.desc}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Box>

                <Box className="match-types" sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Match Types
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { type: 'direct', desc: 'Exact match with scheme and participant ID' },
                      { type: 'endpoint_match', desc: 'Match by endpoint ID only' },
                      { type: 'normalized_match', desc: 'Match with normalized participant ID' },
                      { type: 'alternative_schemes', desc: 'Found with different schemes' },
                      { type: 'not_found', desc: 'No match found' }
                    ].map((item) => (
                      <Grid item xs={12} md={6} key={item.type}>
                        <Chip label={item.type} variant="outlined" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </TabPanel>

              {/* Examples Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h4" gutterBottom className="section-title">
                  API Examples
                </Typography>

                <Grid container spacing={4}>
                  {/* Request Examples */}
                  <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                      Request Examples
                    </Typography>
                    <Grid container spacing={3}>
                      {Object.entries(requestExamples).map(([key, example]) => (
                        <Grid item xs={12} md={6} key={key}>
                          <Card variant="outlined" className="example-card">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {example.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {example.description}
                              </Typography>
                              <Box className="code-header">
                                <Typography variant="caption" fontWeight={600}>
                                  JSON Payload
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={copiedCode === `req-${key}` ? <CheckIcon /> : <ContentCopyIcon />}
                                  onClick={() => copyToClipboard(example.code, `req-${key}`)}
                                >
                                  {copiedCode === `req-${key}` ? 'Copied!' : 'Copy'}
                                </Button>
                              </Box>
                              <Paper variant="outlined" className="code-paper">
                                <pre className="code-block">
                                  {example.code}
                                </pre>
                              </Paper>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {/* Response Examples */}
                  <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                      Response Examples
                    </Typography>
                    <Grid container spacing={3}>
                      {Object.entries(responseExamples).map(([key, example]) => (
                        <Grid item xs={12} key={key}>
                          <Card variant="outlined" className="example-card">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {example.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {example.description}
                              </Typography>
                              <Box className="code-header">
                                <Typography variant="caption" fontWeight={600}>
                                  Response JSON
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={copiedCode === `resp-${key}` ? <CheckIcon /> : <ContentCopyIcon />}
                                  onClick={() => copyToClipboard(example.code, `resp-${key}`)}
                                >
                                  {copiedCode === `resp-${key}` ? 'Copied!' : 'Copy'}
                                </Button>
                              </Box>
                              <Paper variant="outlined" className="code-paper">
                                <pre className="code-block">
                                  {example.code}
                                </pre>
                              </Paper>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Fade in timeout={1000}>
          <Box className="cta-section">
            <Typography variant="h5" gutterBottom textAlign="center">
              Ready to Integrate?
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" paragraph>
              Start validating Peppol participants in your applications today.
            </Typography>
            <Box className="cta-buttons">
              <Button 
                variant="contained" 
                size="large"
                href="/"
                className="cta-button"
              >
                Try Live Demo
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => copyToClipboard('https://peppolchecker.online/api/check-participant', 'endpoint')}
                className="cta-button"
              >
                Copy Endpoint URL
              </Button>
            </Box>
          </Box>
        </Fade>
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