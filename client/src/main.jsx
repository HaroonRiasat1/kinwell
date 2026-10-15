import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { I18nProvider } from './i18n/index.js';
import { ToastProvider } from './components/ui/index.js';
import App from './App.jsx';
import { TourProvider } from './components/tour/index.js';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <TourProvider>
              <App />
            </TourProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
);
