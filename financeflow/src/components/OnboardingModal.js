import React from 'react';
import './OnboardingModal.css';

// PUBLIC_INTERFACE
function OnboardingModal({ onClose }) {
  return (
    <div className="onboarding-modal-bg" role="dialog" aria-modal="true">
      <div className="onboarding-modal">
        <h2>Welcome to FinanceFlow!</h2>
        <ul>
          <li>Manage your income and expenses with ease.</li>
          <li>Visualize spending via interactive charts.</li>
          <li>Set a savings goal and track your progress.</li>
          <li>Your data is private and stays on your device (unless you connect a cloud account).</li>
        </ul>
        <button className="btn btn-large" onClick={onClose}>Get Started</button>
      </div>
    </div>
  );
}

export default OnboardingModal;
