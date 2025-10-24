"use client";
import { useState, useEffect, useRef } from "react";
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Grid,
  Fade,
  Zoom,
  Collapse,
  LinearProgress,
  CircularProgress,
  IconButton,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { theme } from "../theme";

import "./xml-to-pdf.css";

export default function XmlToPdfPage() {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [allCompleted, setAllCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    const handleDragOver = (e) => {
      e.preventDefault();
      dropArea.classList.add("drag-over");
    };
    const handleDragLeave = () => {
      dropArea.classList.remove("drag-over");
    };
    const handleDrop = (e) => {
      e.preventDefault();
      dropArea.classList.remove("drag-over");
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".xml")
      );
      handleAddFiles(files);
    };

    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleAddFiles = (files) => {
    const limited = files.slice(0, 10);

    const nameCount = {};
    const nameMap = new Map();

    const renamedFiles = limited.map((file) => {
      const ext = file.name.split(".").pop();
      const base = file.name.replace(`.${ext}`, "");

      if (!nameMap.has(base)) {
        nameMap.set(base, 1);
        return file;
      } else {
        const count = nameMap.get(base) + 1;
        nameMap.set(base, count);
        const newName = `${base}_${count.toString().padStart(3, "0")}.${ext}`;
        return new File([file], newName, { type: file.type });
      }
    });

    setXmlFiles(renamedFiles);
    setStatusList(
      renamedFiles.map((f) => ({ name: f.name, status: "pending" }))
    );
    setAllCompleted(false);
    setHasError(false);
  };

  const handleFileChange = (e) => {
    handleAddFiles(Array.from(e.target.files));
  };

  const updateStatus = (name, newStatus) => {
    setStatusList((prev) =>
      prev.map((f) => (f.name === name ? { ...f, status: newStatus } : f))
    );
  };

  const handleConvert = async () => {
    if (xmlFiles.length === 0) return;

    setLoading(true);
    setProgress(0);
    setCurrentFile("");
    setAllCompleted(false);
    setHasError(false);

    const zip = new JSZip();
    let completed = 0;
    let errorFound = false;

    const usedFileNames = new Set();
    let singlePdfBlob = null;
    let singleFileName = "";

    for (let i = 0; i < xmlFiles.length; i++) {
      const file = xmlFiles[i];
      setCurrentFile(file.name);
      updateStatus(file.name, "processing");

      try {
        const formData = new FormData();
        formData.append("xml", file);
        const response = await fetch("/api/xml-to-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Conversion failed");

        const contentDisposition = response.headers.get("Content-Disposition");
        let fileName = "converted.pdf";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="([^"]+)"/);
          if (match) fileName = match[1];
        }

        const blob = await response.blob();

        if (xmlFiles.length === 1) {
          singlePdfBlob = blob;
          singleFileName = fileName;
        } else {
          let finalFileName = fileName;
          if (usedFileNames.has(fileName)) {
            const base = fileName.replace(".pdf", "");
            let counter = 1;
            while (
              usedFileNames.has(
                `${base}_${counter.toString().padStart(3, "0")}.pdf`
              )
            ) {
              counter++;
            }
            finalFileName = `${base}_${counter.toString().padStart(3, "0")}.pdf`;
          }

          usedFileNames.add(finalFileName);
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(finalFileName, arrayBuffer);
        }

        updateStatus(file.name, "success");
      } catch (err) {
        console.error("Conversion error:", err);
        updateStatus(file.name, "failed");
        errorFound = true;
      }

      completed++;
      setProgress(Math.round((completed / xmlFiles.length) * 100));
    }

    if (!errorFound) {
      if (xmlFiles.length === 1 && singlePdfBlob) {
        saveAs(singlePdfBlob, singleFileName);
      } else if (xmlFiles.length > 1) {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "converted_files.zip");
      }
    }

    setHasError(errorFound);
    setLoading(false);
    setAllCompleted(!errorFound);
  };

  useEffect(() => {
    if (allCompleted && !hasError) {
      const timer = setTimeout(() => {
        setStatusList([]);
        setProgress(0);
        setAllCompleted(false);
        setHasError(false);
        setCurrentFile("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, hasError]);

  const handleReset = () => {
    setXmlFiles([]);
    setStatusList([]);
    setProgress(0);
    setAllCompleted(false);
    setHasError(false);
    setCurrentFile("");
    setExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box textAlign="center" sx={{ mt: 4, mb: 4 }}>
        <Fade in timeout={800}>
          <Box>
            <Typography variant="h4" component="h1">
              XML to PDF Converter
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 1.5, maxWidth: "600px", mx: "auto" }}
            >
              Upload or drag XML files (up to 10). Converts to PDF & downloads as{" "}
              {xmlFiles.length === 1 ? "PDF" : "ZIP"}.
            </Typography>
          </Box>
        </Fade>
      </Box>

      <Box>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
        >
          <Grid item xs={12} md={5}>
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
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: "500px",
                }}
              >
                <Box
                  ref={dropRef}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ flexShrink: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <DescriptionIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ mb: 1, textAlign: "center" }}
                    >
                      Upload XML Files
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mb: 3, textAlign: "center" }}
                    >
                      Drag & drop your XML files here or click below
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      sx={{
                        borderRadius: theme.shape.borderRadius,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        border: `2px dashed ${theme.palette.grey[200]}`,
                        textTransform: "none",
                        width: "100%",
                        "&:hover": {
                          border: `2px dashed ${theme.palette.primary.main}`,
                          bgcolor: theme.palette.primary.light,
                        },
                      }}
                    >
                      Choose XML Files
                      <input
                        type="file"
                        accept=".xml"
                        hidden
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Box>

                  {xmlFiles.length > 0 && (
                    <Box
                      sx={{
                        mt: 3,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          background: theme.palette.grey[50],
                          borderRadius: theme.shape.borderRadius,
                          p: "12px 16px",
                          border: `1px solid ${theme.palette.grey[200]}`,
                          flexShrink: 0,
                        }}
                        onClick={() => setExpanded((prev) => !prev)}
                      >
                        <Typography fontWeight={700} color="text.primary">
                          {xmlFiles.length} Files Selected
                        </Typography>
                        <IconButton size="small">
                          {expanded ? (
                            <ExpandLessIcon sx={{ color: theme.palette.primary.main }} />
                          ) : (
                            <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
                          )}
                        </IconButton>
                      </Box>

                      <Collapse
                        in={expanded}
                        timeout="auto"
                        unmountOnExit
                        sx={{ flex: 1, minHeight: 0 }}
                      >
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            height: "100%",
                            overflowY: "auto",
                            pr: 1,
                            pb: 1,
                          }}
                        >
                          {statusList.map((f, i) => (
                            <Box
                              key={i}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.grey[200]}`,
                                borderRadius: theme.shape.borderRadius,
                                p: "10px 12px",
                                fontSize: "0.9rem",
                                color:
                                  f.status === "success"
                                    ? theme.palette.success.main
                                    : f.status === "failed"
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {f.name}
                              </Box>
                              {f.status === "pending" && (
                                <InfoIcon
                                  sx={{ fontSize: 18, color: theme.palette.grey[400], ml: 1 }}
                                />
                              )}
                              {f.status === "processing" && (
                                <CircularProgress
                                  size={16}
                                  color="primary"
                                  thickness={6}
                                  sx={{ ml: 1 }}
                                />
                              )}
                              {f.status === "success" && (
                                <CheckCircleIcon
                                  sx={{ fontSize: 18, color: theme.palette.success.main, ml: 1 }}
                                />
                              )}
                              {f.status === "failed" && (
                                <CancelIcon
                                  sx={{ fontSize: 18, color: theme.palette.error.main, ml: 1 }}
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    p: 3,
                    pt: 2,
                    borderTop: xmlFiles.length > 0 ? `1px solid ${theme.palette.grey[200]}` : "none",
                    flexShrink: 0,
                    display: "flex",
                    gap: 1,
                  }}
                >
                  {xmlFiles.length > 0 && !loading && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleReset}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      Clear Files
                    </Button>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={xmlFiles.length === 0 || loading}
                    onClick={handleConvert}
                    sx={{
                      flex: 2,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                      "&:hover": {
                        bgcolor: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px rgba(23, 92, 211, 0.3)`,
                      },
                      "&:active": { transform: "translateY(0)" },
                    }}
                    startIcon={<DownloadIcon />}
                  >
                    {loading
                      ? "Converting..."
                      : `Convert to ${xmlFiles.length === 1 ? "PDF" : "ZIP"}`}
                  </Button>
                </Box>
              </Paper>
            </Zoom>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: "center",
                height: "100%",
                minHeight: "500px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
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
              {!loading && !allCompleted && (
                <Fade in timeout={800}>
                  <Box sx={{ textAlign: "center", maxWidth: "400px" }}>
                    {xmlFiles.length > 0 ? (
                      <PictureAsPdfIcon
                        color="primary"
                        sx={{ fontSize: 64, mb: 2 }}
                      />
                    ) : (
                      <InfoIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
                    )}

                    <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                      {xmlFiles.length > 0 ? "Ready to Convert" : "Ready when you are"}
                    </Typography>

                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {xmlFiles.length > 0
                        ? `${xmlFiles.length} file(s) selected. Click "Convert to ${
                            xmlFiles.length === 1 ? "PDF" : "ZIP"
                          }" to start.`
                        : 'Select XML files on the left and click "Convert to PDF"'}
                    </Typography>

                    {xmlFiles.length > 0 && (
                      <Box
                        sx={{
                          mt: 3,
                          p: 2,
                          background: theme.palette.grey[50],
                          borderRadius: theme.shape.borderRadius,
                          border: `1px solid ${theme.palette.grey[200]}`,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {xmlFiles.length === 1
                            ? "📄 Single file will be downloaded as PDF directly"
                            : "📁 Multiple files will be downloaded as ZIP archive"}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Fade>
              )}

              {loading && (
                <Fade in timeout={500}>
                  <Box
                    sx={{ textAlign: "center", maxWidth: "500px", width: "100%" }}
                  >
                    <CircularProgress
                      size={80}
                      thickness={2}
                      sx={{ mb: 3, color: theme.palette.primary.main }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{ mb: 2, color: theme.palette.primary.main }}
                    >
                      Converting {xmlFiles.length} files...
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        mb: 2,
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      {progress}% completed
                    </Typography>
                    {currentFile && (
                      <Typography
                        variant="body1"
                        sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
                      >
                        Processing: {currentFile}
                      </Typography>
                    )}
                  </Box>
                </Fade>
              )}

              {allCompleted && !hasError && (
                <Fade in timeout={500}>
                  <Box sx={{ textAlign: "center", maxWidth: "400px" }}>
                    <CheckCircleIcon
                      sx={{ fontSize: 80, color: theme.palette.success.main, mb: 2 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ mb: 2, color: theme.palette.success.dark }}
                    >
                      Conversion Successful
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {xmlFiles.length === 1
                        ? "Your PDF file has been downloaded successfully"
                        : "Your ZIP file has been generated and downloaded successfully"}
                    </Typography>
                    <Button variant="outlined" onClick={handleReset} sx={{ mt: 2 }}>
                      Convert More Files
                    </Button>
                  </Box>
                </Fade>
              )}

              {hasError && !loading && (
                <Fade in timeout={500}>
                  <Box sx={{ textAlign: "center", maxWidth: "400px" }}>
                    <CancelIcon
                      sx={{ fontSize: 80, color: theme.palette.error.main, mb: 2 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ mb: 2, color: theme.palette.error.main }}
                    >
                      Conversion Failed
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Some files failed to convert. Please check and try again.
                    </Typography>
                    <Button variant="outlined" onClick={handleReset} sx={{ mt: 2 }}>
                      Try Again
                    </Button>
                  </Box>
                </Fade>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}