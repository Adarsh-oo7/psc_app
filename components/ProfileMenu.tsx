import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton, Avatar, Menu, MenuItem, Tooltip, Divider, ListItemIcon } from '@mui/material';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';

// Import icons for the menu items
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

export default function ProfileMenu() {
  const { user, logout, fetcher } = useAppContext();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: profileData } = useSWR(user ? '/auth/profile/' : null, fetcher);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNavigate = (path: string) => {
    handleClose();
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    window.location.href = '/login';
  };

  return (
    <Box>
      <Tooltip title={user ? user.username : 'Guest'}>
        <IconButton onClick={handleClick} size="small" sx={{ ml: 1, p: 0 }}>
          <Avatar
            src={profileData?.profile_photo || ''}
            alt={user?.username?.charAt(0).toUpperCase() || 'G'}
            sx={{ width: 40, height: 40 }}
          />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5, '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1, },
            '&::before': {
              content: '""', display: 'block', position: 'absolute', top: 0,
              right: 14, width: 10, height: 10, bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
          <MenuItem onClick={() => handleNavigate('/profile')}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          
          {/* --- NEW: Settings Menu Item --- */}
          <MenuItem onClick={() => handleNavigate('/settings')}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>

          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
      </Menu>
    </Box>
  );
}
