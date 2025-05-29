import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import ThemeProvider from './components/ThemeProvider';
import Navbar from './components/Navbar';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './components/Dashboard';
import ToastNotification from './components/ToastNotification';

// PUBLIC_INTERFACE
function App() {
  // Onboarding flag
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Toast notification: { message, type } or null
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Show onboarding if first visit
    if (!localStorage.getItem('fflow-onboarded')) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDismiss = () => {
    localStorage.setItem('fflow-onboarded', '1');
    setShowOnboarding(false);
  };

  // Toast utility for child components
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    // Auto dismiss
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ThemeProvider>
      <div className="app" tabIndex="-1">
        <Navbar />
        <main>
          <Dashboard showToast={notify} />
        </main>
        {showOnboarding && (
          <OnboardingModal onClose={handleOnboardingDismiss} />
        )}
        {toast && (
          <ToastNotification message={toast.message} type={toast.type} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;