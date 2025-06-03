import React, { useState, useRef, useEffect } from 'react';
import './SavingsGoalModal.css';

/**
 * PUBLIC_INTERFACE
 * SavingsGoalModal - Modal for setting or editing the user's savings goal.
 * Validates user input, provides feedback for errors, disables Save button when invalid or saving.
 */
function SavingsGoalModal({ onSave, onClose, initial }) {
  const [amount, setAmount] = useState(
    typeof initial?.target === "number" ? String(initial.target) : ""
  );
  const [period, setPeriod] = useState(initial?.period || "monthly");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef();

  // New: Track if the current form state is valid as user types.
  const isValid = (() => validate({ period, amount }) === "")();

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  // PUBLIC_INTERFACE
  function validate({ period, amount }) {
    if (!period || !["weekly", "monthly", "quarterly", "yearly"].includes(period)) {
      return "Please select a valid savings period.";
    }
    if (!amount || isNaN(Number(amount))) {
      return "Please enter a valid amount.";
    }
    const num = Number(amount);
    if (num <= 0) {
      return "Amount must be greater than zero.";
    }
    if (String(num).length > 12) {
      return "Amount is too large.";
    }
    return "";
  }

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const validationError = validate({ period, amount });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);

    // Simulate async save, but allow immediate feedback (fake, since it's localStorage)
    setTimeout(() => {
      try {
        onSave({ period, target: Number(amount), achieved: false });
        setSaving(false);
      } catch (err) {
        setSaving(false);
        setError("Failed to save goal. Try again.");
      }
    }, 100);
  }

  // PUBLIC_INTERFACE
  function handleAmountChange(e) {
    setAmount(e.target.value);
    if (error) setError("");
  }

  // PUBLIC_INTERFACE
  function handlePeriodChange(e) {
    setPeriod(e.target.value);
    if (error) setError("");
  }

  return (
    <div className="goalmodal-bg" role="dialog" aria-modal="true" tabIndex={-1}>
      <form className="goalmodal" onSubmit={handleSubmit} noValidate>
        <h3>Set Savings Goal</h3>
        <label htmlFor="goal-period" style={{ marginBottom: 9, fontWeight: 500 }}>
          Savings Period
          <select
            id="goal-period"
            ref={ref}
            aria-label="Savings period"
            value={period}
            onChange={handlePeriodChange}
            disabled={saving}
            style={{ marginTop: 3, marginBottom: 12, width: "100%" }}
            required
          >
            <option value="weekly">Weekly Goal</option>
            <option value="monthly">Monthly Goal</option>
            <option value="quarterly">Quarterly Goal</option>
            <option value="yearly">Yearly Goal</option>
          </select>
        </label>
        <label htmlFor="goal-amount" style={{ fontWeight: 500 }}>
          Target Amount
          <input
            id="goal-amount"
            type="number"
            aria-label="Target amount"
            placeholder="Amount in $"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={handleAmountChange}
            required
            disabled={saving}
            style={{ marginTop: 3, marginBottom: 11, width: "100%" }}
            inputMode="decimal"
          />
        </label>
        {error && (
          <div className="goalmodal-error" aria-live="polite" role="alert">
            {error}
          </div>
        )}
        <div className="goalmodal-btnrow">
          <button
            type="submit"
            className="btn btn-large"
            disabled={saving || !isValid}
            style={{
              opacity: saving || !isValid ? 0.75 : 1,
              minWidth: 94,
              pointerEvents: saving || !isValid ? "none" : undefined,
            }}
            aria-busy={saving ? "true" : undefined}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="btn btn-cancel"
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ minWidth: 90, marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SavingsGoalModal;
