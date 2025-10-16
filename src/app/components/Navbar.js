"use client";
import { 
  AppBar, Toolbar, Typography, Button, Box,
  useMediaQuery, Drawer, List, ListItem, IconButton
} from "@mui/material";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles"; // <-- bu eklendi
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

export default function Navbar() {
  const theme = useTheme(); // <-- theme burada alınır
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'API Docs', href: '/api-docs' }
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const drawer = (
    <Box
      sx={{ width: 250, padding: 2, height: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #101828 0%, #175cd3 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Peppol Check
        </Typography>
        <IconButton onClick={toggleDrawer(false)}><CloseIcon /></IconButton>
      </Box>
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
            <Button
              fullWidth
              href={item.href}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: isActive(item.href) ? 600 : 500,
                color: isActive(item.href) ? '#175cd3' : '#667085',
                backgroundColor: isActive(item.href) ? '#f0f9ff' : 'transparent',
                border: isActive(item.href) ? '1px solid #175cd3' : '1px solid transparent',
                '&:hover': { backgroundColor: '#f8fafc', color: '#101828' }
              }}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 4, p: 2, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <Typography variant="caption" color="text.secondary">Built by Can Matik</Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#ffffff', color: '#101828', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar sx={{ minHeight: { xs: '60px', md: '64px' }, px: { xs: 2, sm: 3 }, maxWidth: '1200px', mx: 'auto', width: '100%' }}>
          <Typography variant="h6" component="a" href="/" sx={{ flexGrow: { xs: 1, md: 0 }, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, background: 'linear-gradient(135deg, #101828 0%, #175cd3 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', '&:hover': { opacity: 0.8 } }}>
            Peppol Participant Check
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, justifyContent: 'center', mx: 4 }}>
              {navItems.map((item) => (
                <Button key={item.label} href={item.href} sx={{
                  fontWeight: isActive(item.href) ? 600 : 500,
                  color: isActive(item.href) ? '#175cd3' : '#667085',
                  backgroundColor: isActive(item.href) ? '#f0f9ff' : 'transparent',
                  border: isActive(item.href) ? '1px solid #175cd3' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': { backgroundColor: '#f8fafc', color: '#101828' }
                }}>
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {!isMobile && <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>by Can Matik</Typography>}

          {isMobile && (
            <IconButton edge="end" color="inherit" aria-label="menu" onClick={toggleDrawer(true)} sx={{ color: '#101828', p: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)} sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 } }}>
        {drawer}
      </Drawer>
    </>
  );
}
