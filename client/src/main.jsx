import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 2000,
              style: {
                background: '#14141F',
                color: '#F0F0F5',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                maxWidth: '90vw',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: {
                iconTheme: {
                  primary: '#34D399',
                  secondary: '#14141F',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F87171',
                  secondary: '#14141F',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
