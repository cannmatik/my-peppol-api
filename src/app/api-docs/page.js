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
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CodeIcon from "@mui/icons-material/Code";
import ApiIcon from "@mui/icons-material/Api";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import SearchIcon from "@mui/icons-material/Search";
import PublicIcon from "@mui/icons-material/Public";
import SchemaIcon from "@mui/icons-material/Schema";
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

  // API Endpoints
  const apiEndpoints = [
    {
      method: "GET",
      path: "/api/participants",
      description: "Get all participants with pagination and filtering",
      parameters: [
        { name: "page", type: "number", optional: true, desc: "Page number (default: 1)" },
        { name: "limit", type: "number", optional: true, desc: "Items per page (default: 100, max: 1000)" },
        { name: "country", type: "string", optional: true, desc: "Filter by country code (e.g., BE, DE, FR)" },
        { name: "scheme", type: "string", optional: true, desc: "Filter by scheme ID (e.g., 9925, 0208)" },
        { name: "company", type: "string", optional: true, desc: "Search by company name" },
        { name: "documentType", type: "string", optional: true, desc: "Filter by document type" },
        { name: "supportsInvoice", type: "boolean", optional: true, desc: "Filter by invoice support" },
        { name: "supportsCreditnote", type: "boolean", optional: true, desc: "Filter by credit note support" }
      ]
    },
    {
      method: "GET",
      path: "/api/participants/count",
      description: "Get total participant count with optional filters",
      parameters: [
        { name: "country", type: "string", optional: true, desc: "Filter by country code" },
        { name: "scheme", type: "string", optional: true, desc: "Filter by scheme ID" },
        { name: "company", type: "string", optional: true, desc: "Search by company name" }
      ]
    },
    {
      method: "GET",
      path: "/api/participants/countries",
      description: "Get list of unique country codes",
      parameters: []
    },
    {
      method: "GET",
      path: "/api/participants/schemes",
      description: "Get list of unique scheme IDs",
      parameters: []
    },
    {
      method: "GET", 
      path: "/api/participants/by-country/{countryCode}",
      description: "Get participants by specific country",
      parameters: [
        { name: "countryCode", type: "string", optional: false, desc: "Country code (e.g., BE, DE, FR)" },
        { name: "page", type: "number", optional: true, desc: "Page number" },
        { name: "limit", type: "number", optional: true, desc: "Items per page" }
      ]
    },
    {
      method: "POST",
      path: "/api/check-participant",
      description: "Validate participant and check document support",
      parameters: [
        { name: "schemeID", type: "string", optional: false, desc: "Participant scheme ID" },
        { name: "participantID", type: "string", optional: false, desc: "Participant identifier" },
        { name: "documentType", type: "string", optional: true, desc: "Document type to check" }
      ]
    }
  ];

  // Request examples
  const requestExamples = {
    getAll: {
      title: "Get All Participants",
      description: "Retrieve participants with pagination",
      code: `GET /api/participants?page=1&limit=50`
    },
    filtered: {
      title: "Filtered Search",
      description: "Search with multiple filters",
      code: `GET /api/participants?country=BE&scheme=9925&supportsInvoice=true&limit=50`
    },
    countrySearch: {
      title: "Country-specific",
      description: "Get participants by country",
      code: `GET /api/participants/by-country/DE?page=1&limit=100`
    },
    count: {
      title: "Get Count",
      description: "Get total count with filters",
      code: `GET /api/participants/count?country=FR&supportsInvoice=true`
    },
    checkParticipant: {
      title: "Validate Participant",
      description: "Check participant and document support",
      code: `POST /api/check-participant\nContent-Type: application/json\n\n{
  "schemeID": "0208",
  "participantID": "1009049626",
  "documentType": "Invoice"
}`
    }
  };

  // Response examples
  const responseExamples = {
    participantsList: {
      title: "Participants List Response",
      description: "Paginated list of participants",
      code: `{
  "success": true,
  "count": 50,
  "totalCount": 8500,
  "totalPages": 170,
  "currentPage": 1,
  "filters": {
    "countryCode": "BE",
    "schemeId": "9925",
    "supportsInvoice": true
  },
  "data": [
    {
      "id": 146776,
      "full_pid": "9925:be0862669993",
      "scheme_id": "9925",
      "endpoint_id": "be0862669993",
      "supports_invoice": true,
      "supports_creditnote": true,
      "company_name": "K-Line Belgium NV",
      "country_code": "BE",
      "registration_date": "2023-05-15",
      "document_types": ["Invoice", "CreditNote", "Order"],
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}`
    },
    countResponse: {
      title: "Count Response",
      description: "Total participant count",
      code: `{
  "success": true,
  "totalCount": 1250,
  "filters": {
    "countryCode": "FR",
    "supportsInvoice": true
  }
}`
    },
    countriesResponse: {
      title: "Countries List",
      description: "Unique country codes",
      code: `{
  "success": true,
  "count": 45,
  "countries": ["BE", "DE", "FR", "NL", "GB", "US", ...]
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
    "Invoice", "CreditNote", "Order", "OrderResponse", "Catalogue",
    "DispatchAdvice", "ApplicationResponse", "PriceList", "Statement"
  ];

  const commonCountries = [
    "BE", "DE", "FR", "NL", "GB", "US", "NO", "SE", "DK", "IT", "ES", "PL"
  ];

  return (
    <>
      <Container maxWidth="lg" className="api-docs-container">
        {/* Header */}
        <Box textAlign="center" className="api-header-box">
          <Fade in timeout={800}>
            <Box>
              <Typography variant="h3" component="h1" className="api-main-title">
                API Documentation
              </Typography>
              <Typography variant="h6" color="text.secondary" className="api-subtitle">
                Complete Peppol participant data and validation APIs
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
                  <strong>No API key required</strong> - Free access to comprehensive Peppol participant data and validation.
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📊 Data APIs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access complete participant database with filtering, pagination, and search.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    🔍 Validation API
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validate participants and check document type support in real-time.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    ⚡ Real-time
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fresh data with comprehensive filtering and search capabilities.
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
                  startIcon={<ApiIcon />}
                >
                  All Endpoints
                </Button>
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 2 ? 'active' : ''}`}
                  onClick={() => setTabValue(2)}
                  startIcon={<CodeIcon />}
                >
                  Examples
                </Button>
                <Button 
                  fullWidth 
                  className={`nav-button ${tabValue === 3 ? 'active' : ''}`}
                  onClick={() => setTabValue(3)}
                  startIcon={<GetAppIcon />}
                >
                  Quick Start
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
                  Common Countries
                </Typography>
                <Box className="common-chips">
                  {commonCountries.map((country) => (
                    <Chip
                      key={country}
                      label={country}
                      size="small"
                      variant="outlined"
                      className="common-chip"
                    />
                  ))}
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                  Document Types
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
                <Tab label="Endpoints" />
                <Tab label="Examples" />
                <Tab label="Quick Start" />
              </Tabs>

              <Divider />

              {/* Overview Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h4" gutterBottom className="section-title">
                  API Overview
                </Typography>
                
                <Typography variant="body1" paragraph>
                  The Peppol Participant API provides comprehensive access to Peppol participant data, 
                  including real-time validation, filtering, search, and detailed participant information.
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          📊 Complete Database
                        </Typography>
                        <Typography variant="body2">
                          Access thousands of Peppol participants with detailed information including document support.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          🔍 Advanced Filtering
                        </Typography>
                        <Typography variant="body2">
                          Filter by country, scheme, document type, company name, and support status.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          📄 Pagination & Search
                        </Typography>
                        <Typography variant="body2">
                          Efficient pagination with customizable limits and full-text search capabilities.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" className="feature-card">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          ✅ Validation
                        </Typography>
                        <Typography variant="body2">
                          Real-time participant validation and document type support checking.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                    Key Features
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <SearchIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Advanced Search & Filtering" 
                        secondary="Filter by multiple criteria including country, scheme, document types, and company name"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <GetAppIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Flexible Pagination" 
                        secondary="Control page size up to 1000 records per request with efficient pagination"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PublicIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Country & Scheme Data" 
                        secondary="Access unique country codes and scheme IDs for dynamic filtering"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchemaIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Document Type Support" 
                        secondary="Check supported document types for each participant"
                      />
                    </ListItem>
                  </List>
                </Box>
              </TabPanel>

              {/* Endpoints Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h4" gutterBottom className="section-title">
                  API Endpoints
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  All endpoints return JSON responses. No authentication required.
                </Alert>

                {apiEndpoints.map((endpoint, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          label={endpoint.method} 
                          color={endpoint.method === 'POST' ? 'primary' : 'success'}
                          variant="filled"
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="h6" component="code">
                          {endpoint.path}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {endpoint.description}
                      </Typography>

                      {endpoint.parameters.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            Parameters:
                          </Typography>
                          <Grid container spacing={1}>
                            {endpoint.parameters.map((param, paramIndex) => (
                              <Grid item xs={12} key={paramIndex}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 120 }}>
                                    {param.name}
                                  </Typography>
                                  <Chip 
                                    label={param.type} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontFamily: 'monospace' }}
                                  />
                                  <Chip 
                                    label={param.optional ? 'optional' : 'required'} 
                                    size="small"
                                    color={param.optional ? 'default' : 'error'}
                                    variant="outlined"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {param.desc}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabPanel>

              {/* Examples Tab */}
              <TabPanel value={tabValue} index={2}>
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
                                  {key === 'checkParticipant' ? 'HTTP Request' : 'URL'}
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

              {/* Quick Start Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h4" gutterBottom className="section-title">
                  Quick Start Guide
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                    1. Get All Participants
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Start by fetching participants with pagination:
                  </Typography>
                  
                  <Box className="code-example-box">
                    <Box className="code-header">
                      <Typography variant="h6">
                        Example Request
                      </Typography>
                      <Button
                        size="small"
                        startIcon={copiedCode === 'quickstart-1' ? <CheckIcon /> : <ContentCopyIcon />}
                        onClick={() => copyToClipboard(requestExamples.getAll.code, 'quickstart-1')}
                      >
                        {copiedCode === 'quickstart-1' ? 'Copied!' : 'Copy'}
                      </Button>
                    </Box>
                    <Paper variant="outlined" className="code-paper">
                      <pre className="code-block">
                        {requestExamples.getAll.code}
                      </pre>
                    </Paper>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                    2. Filter Participants
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Use filters to find specific participants:
                  </Typography>
                  
                  <Box className="code-example-box">
                    <Box className="code-header">
                      <Typography variant="h6">
                        Example: Belgian participants with invoice support
                      </Typography>
                      <Button
                        size="small"
                        startIcon={copiedCode === 'quickstart-2' ? <CheckIcon /> : <ContentCopyIcon />}
                        onClick={() => copyToClipboard(requestExamples.filtered.code, 'quickstart-2')}
                      >
                        {copiedCode === 'quickstart-2' ? 'Copied!' : 'Copy'}
                      </Button>
                    </Box>
                    <Paper variant="outlined" className="code-paper">
                      <pre className="code-block">
                        {requestExamples.filtered.code}
                      </pre>
                    </Paper>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                    3. Validate Specific Participant
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Check if a participant exists and supports specific documents:
                  </Typography>
                  
                  <Box className="code-example-box">
                    <Box className="code-header">
                      <Typography variant="h6">
                        Example Validation Request
                      </Typography>
                      <Button
                        size="small"
                        startIcon={copiedCode === 'quickstart-3' ? <CheckIcon /> : <ContentCopyIcon />}
                        onClick={() => copyToClipboard(requestExamples.checkParticipant.code, 'quickstart-3')}
                      >
                        {copiedCode === 'quickstart-3' ? 'Copied!' : 'Copy'}
                      </Button>
                    </Box>
                    <Paper variant="outlined" className="code-paper">
                      <pre className="code-block">
                        {requestExamples.checkParticipant.code}
                      </pre>
                    </Paper>
                  </Box>
                </Box>

                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Pro Tip:</strong> Use the count endpoint first to get total numbers before fetching large datasets.
                    Combine multiple filters for precise searches.
                  </Typography>
                </Alert>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Fade in timeout={1000}>
          <Box className="cta-section">
            <Typography variant="h5" gutterBottom textAlign="center">
              Ready to Build?
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" paragraph>
              Start integrating comprehensive Peppol participant data into your applications.
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
                onClick={() => copyToClipboard('https://peppolchecker.online/api', 'base-url')}
                className="cta-button"
              >
                Copy Base URL
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