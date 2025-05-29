import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import ThemeProvider from './components/ThemeProvider';
import Sidebar from './components/Sidebar';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './components/Dashboard';
import ToastNotification from './components/ToastNotification';

// Placeholder views
function ExpensesView() {
  return (
    <section className="placeholder-view"><h1>Expenses</h1>
      <div className="container"><p>Your expenses will appear here soon.</p></div>
    </section>
  );
}
function CalendarView() {
  return (
    <section className="placeholder-view"><h1>Calendar</h1>
      <div className="container"><p>The finance calendar will be displayed here.</p></div>
    </section>
  );
}
function ProfileView() {
  return (
    <section className="placeholder-view"><h1>Profile</h1>
      <div className="container"><p>User profile management coming soon.</p></div>
    </section>
  );
}
function SettingsView() {
  return (
    <section className="placeholder-view"><h1>Settings</h1>
      <div className="container"><p>Settings and app preferences go here.</p></div>
    </section>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Onboarding flag
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Toast notification: { message, type } or null
  const [toast, setToast] = useState(null);

  // Simple in-app router (hash-based for SPA)
  const initialRoute = window.location.hash.replace('#', '') || '/';
  const [route, setRoute] = useState(initialRoute);

  useEffect(() => {
    // Show onboarding if first visit
    if (!localStorage.getItem('fflow-onboarded')) {
      setShowOnboarding(true);
    }
    // Handle hash route change
    const onHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => { window.removeEventListener('hashchange', onHashChange); };
  }, []);

  const handleOnboardingDismiss = () => {
    localStorage.setItem('fflow-onboarded', '1');
    setShowOnboarding(false);
  };

  // Nav handler to update route
  const handleNavigate = (to) => {
    if (to !== route) {
      window.location.hash = to;
      setRoute(to);
    }
  };

  // Toast utility for child components
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    // Auto dismiss
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Collapse sidebar on mobile by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 650
  );
  useEffect(() => {
    // Responsive collapse/expand on window resize
    const handler = () => {
      if (window.innerWidth < 650 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 650 && sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
    // eslint-disable-next-line
  }, [sidebarCollapsed]);

  // Determine view based on "route"
  let View;
  switch (route) {
    case '/':
      View = <Dashboard showToast={notify} />;
      break;
    case '/expenses':
      View = <ExpensesView />;
      break;
    case '/calendar':
      View = <CalendarView />;
      break;
    case '/profile':
      View = <ProfileView />;
      break;
    case '/settings':
      View = <SettingsView />;
      break;
    default:
      View = <section className="placeholder-view"><div className="container"><h1>Not Found</h1></div></section>;
  }

  return (
    <ThemeProvider>
      <div className="app" tabIndex="-1">
        <Sidebar
          currentRoute={route}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={setSidebarCollapsed}
        />
        <main className="main-content" tabIndex={-1} aria-live="polite">
          {View}
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