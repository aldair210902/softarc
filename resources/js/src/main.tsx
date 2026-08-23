import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { CompanySettingsProvider } from './context/CompanySettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CompanySettingsProvider>
          <App />
        </CompanySettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
