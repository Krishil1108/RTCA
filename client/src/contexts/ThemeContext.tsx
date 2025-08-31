import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useWhatsAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useWhatsAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// WhatsApp-like color schemes
const whatsappLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#128c7e',
      light: '#25d366',
      dark: '#075e54',
    },
    secondary: {
      main: '#25d366',
    },
    background: {
      default: '#f0f2f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#111b21',
      secondary: '#667781',
    },
    divider: '#e9edef',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#128c7e',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

const whatsappDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00a884',
      light: '#25d366',
      dark: '#005c4b',
    },
    secondary: {
      main: '#25d366',
    },
    background: {
      default: '#0b141a',
      paper: '#202c33',
    },
    text: {
      primary: '#e9edef',
      secondary: '#8696a0',
    },
    divider: '#313a42',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#202c33',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#202c33',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#202c33',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#202c33',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#2a3942',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#2a3942',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2a3942',
            '& fieldset': {
              borderColor: '#3b4a54',
            },
            '&:hover fieldset': {
              borderColor: '#54656f',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00a884',
            },
          },
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check system preference
  const getSystemPreference = (): boolean => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Update theme based on mode
  useEffect(() => {
    let darkMode = false;
    
    switch (themeMode) {
      case 'dark':
        darkMode = true;
        break;
      case 'light':
        darkMode = false;
        break;
      case 'auto':
        darkMode = getSystemPreference();
        break;
    }
    
    setIsDarkMode(darkMode);
    
    // Update document body class for additional styling
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [themeMode]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setIsDarkMode(mediaQuery.matches);
        document.body.className = mediaQuery.matches ? 'dark-theme' : 'light-theme';
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('whatsapp-theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeModeState(savedTheme);
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('whatsapp-theme', mode);
  };

  const currentTheme = isDarkMode ? whatsappDarkTheme : whatsappLightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode }}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
