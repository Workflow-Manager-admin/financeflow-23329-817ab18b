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

  // Track if current form values are valid for live disabling
  const isValid = validate({ period, amount }) === "";

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
        // Defensive: Only save if still valid
        if (isValid) {
          onSave({ period, target: Number(amount), achieved: false });
        }
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
      <form
        className="goalmodal"
        onSubmit={handleSubmit}
        noValidate
        role="form"
        aria-labelledby="goalmodal-label-header"
        autoComplete="off"
      >
        <div className="goalmodal-header">
          <h2 id="goalmodal-label-header" style={{ margin: 0, fontSize: "1.22em" }}>
            {initial ? "Edit Savings Goal" : "Set Savings Goal"}
          </h2>
        </div>
        <div className="goalmodal-form-contents" tabIndex={0}>
          <div className="goalmodal-group">
            <label htmlFor="goal-period" className="goalmodal-label">
              Savings Period
            </label>
            <select
              id="goal-period"
              className="goalmodal-select"
              ref={ref}
              aria-label="Savings period"
              value={period}
              onChange={handlePeriodChange}
              disabled={saving}
              required
              tabIndex={0}
              autoFocus
            >
              <option value="weekly">Weekly Goal</option>
              <option value="monthly">Monthly Goal</option>
              <option value="quarterly">Quarterly Goal</option>
              <option value="yearly">Yearly Goal</option>
            </select>
          </div>
          <div className="goalmodal-group">
            <label htmlFor="goal-amount" className="goalmodal-label">
              Target Amount
            </label>
            <input
              id="goal-amount"
              className="goalmodal-input"
              type="number"
              aria-label="Target amount"
              placeholder="Amount in $"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={handleAmountChange}
              required
              disabled={saving}
              inputMode="decimal"
              autoComplete="off"
              tabIndex={0}
            />
          </div>
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
              aria-busy={saving ? "true" : undefined}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn btn-cancel"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SavingsGoalModal;
