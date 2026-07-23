import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import './lib/i18n';
import { pushService } from './services/pushService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// Registrar Service Worker para Notificaciones Push
pushService.registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <App />
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
