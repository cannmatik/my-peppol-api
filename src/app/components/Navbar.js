"use client";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  IconButton,
  Grow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DescriptionIcon from "@mui/icons-material/Description";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import Link from "next/link";

// Debounce fonksiyonu
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: <HomeRoundedIcon sx={{ fontSize: 20 }} /> },
    {
      label: "XML to PDF",
      href: "/xml-to-pdf",
      icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: "API Docs",
      href: "/api-docs",
      icon: <ApiRoundedIcon sx={{ fontSize: 20 }} />,
    },
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift"))
      return;
    setDrawerOpen(open);
  };

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Debounced navigasyon
  const handleNavClick = useCallback(
    debounce((href) => {
      window.location.href = href; // Next.js Link yerine window.location
    }, 200),
    []
  );

  const drawer = (
    <Grow in={drawerOpen} timeout={400}>
      <Box
        sx={{
          width: 280,
          p: 3,
          height: "100%",
          bgcolor: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.grey[200]}`,
        }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
            }}
          >
            Peppol Tools
          </Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon sx={{ color: theme.palette.primary.main }} />
          </IconButton>
        </Box>

        <List>
          {navItems.map((item, index) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 1.5 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Button
                  component="a"
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  startIcon={item.icon}
                  sx={{
                    justifyContent: "flex-start",
                    p: "12px 16px",
                    borderRadius: theme.shape.borderRadius,
                    textTransform: "none",
                    fontWeight: isActive(item.href) ? 600 : 500,
                    color: isActive(item.href) ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                    bgcolor: isActive(item.href) ? theme.palette.primary.light : "transparent",
                    border: isActive(item.href)
                      ? `1px solid ${theme.palette.primary.main}`
                      : "1px solid transparent",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      borderColor: theme.palette.primary.main,
                      transform: "scale(1.02)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      "& .MuiButton-startIcon": {
                        transform: "scale(1.2)",
                        transition: "transform 0.2s ease",
                      },
                    },
                  }}
                >
                  {item.label}
                </Button>
              </motion.div>
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: "auto",
            p: 2,
            bgcolor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Built by Can Matik
          </Typography>
        </Box>
      </Box>
    </Grow>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          mb: 1,
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 2px 6px rgba(0,0,0,0.08)`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: "64px", md: "72px" },
            px: { xs: 2, sm: 4 },
            maxWidth: "1200px",
            mx: "auto",
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h5"
              component="a"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("/");
              }}
              sx={{
                flexGrow: { xs: 1, md: 0 },
                fontWeight: 800,
                fontSize: { xs: "1.4rem", md: "1.6rem" },
                letterSpacing: "-0.5px",
                color: theme.palette.primary.main,
                textDecoration: "none",
                textTransform: "uppercase",
                "&:hover": {
                  opacity: 0.9,
                  transform: "scale(1.03)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Peppol Tools
            </Typography>
          </motion.div>

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1.5, flexGrow: 1, justifyContent: "center", mx: 4 }}>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Button
                    component="a"
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    startIcon={item.icon}
                    sx={{
                      fontWeight: isActive(item.href) ? 600 : 500,
                      color: isActive(item.href) ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                      bgcolor: isActive(item.href) ? theme.palette.primary.light : "transparent",
                      border: isActive(item.href)
                        ? `1px solid ${theme.palette.primary.main}`
                        : "1px solid transparent",
                      borderRadius: theme.shape.borderRadius,
                      padding: "8px 18px",
                      textTransform: "none",
                      fontSize: "0.95rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        borderColor: theme.palette.primary.main,
                        transform: "scale(1.03)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "& .MuiButton-startIcon": {
                          transform: "scale(1.2)",
                          transition: "transform 0.2s ease",
                        },
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                </motion.div>
              ))}
            </Box>
          )}

          {!isMobile && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: "0.85rem" }}
            >
              by Can Matik
            </Typography>
          )}

          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ color: theme.palette.primary.main, p: 1 }}
            >
              <MenuIcon sx={{ fontSize: 28 }} />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box", width: 280 } }}
      >
        {drawer}
      </Drawer>
    </>
  );
}