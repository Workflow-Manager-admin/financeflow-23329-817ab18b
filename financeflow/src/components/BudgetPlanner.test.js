import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetPlanner from "./BudgetPlanner";

// Mock usePreferences with a dollar symbol
jest.mock("./PreferencesProvider", () => ({
  usePreferences: () => ({ currencySymbol: "$" })
}));

const exampleTransactions = [
  // Income
  { id: "tx1", type: "income", amount: 3600, date: "2024-06-05" },
  // Expenses
  { id: "tx2", type: "expense", amount: 700, date: "2024-06-06", category: "Food" },
  { id: "tx3", type: "expense", amount: 400, date: "2024-06-03", category: "Rent/House" }
];

describe("BudgetPlanner", () => {
  beforeEach(() => {
    // Setup: reset localStorage for budgets.
    localStorage.clear();
  });

  it("shows summary with total budget, income, and variance", () => {
    // Set up budgets covering critical categories
    localStorage.setItem("fflow-budgets-v1", JSON.stringify({ Food: 800, "Rent/House": 900 }));
    render(<BudgetPlanner transactions={exampleTransactions} />);
    expect(screen.getByText(/Total Budgeted:/)).toHaveTextContent("$1700.00");
    expect(screen.getByText(/Income this Month:/)).toHaveTextContent("$3600.00");
    expect(screen.getByText(/Budgets are within your income/)).toBeInTheDocument();
  });

  it("shows warning if total budgets exceed income", () => {
    localStorage.setItem(
      "fflow-budgets-v1",
      JSON.stringify({ Food: 3000, "Rent/House": 1000 })
    );
    render(<BudgetPlanner transactions={exampleTransactions} />);
    expect(
      screen.getByText(/Your total expense budgets exceed your income/i)
    ).toBeInTheDocument();
    // Warning text in summary
    expect(
      screen.getByText(/Over Budget! Your expense budgets exceed your income/i)
    ).toBeInTheDocument();
    // Check for "exceeds" labels
    expect(screen.getAllByText(/\(exceeds\)/i).length).toBeGreaterThan(0);
  });

  it("displays variance per category as (budget - actual) and flags over-budget when appropriate", async () => {
    // Over-budget, triggers "exceeds" label in variance
    localStorage.setItem("fflow-budgets-v1", JSON.stringify({ Food: 2700, "Rent/House": 1200 }));
    render(<BudgetPlanner transactions={exampleTransactions} />);
    // Expect "exceeds" rendered in the table
    expect(screen.getAllByText(/\(exceeds\)/i).length).toBeGreaterThan(0);
    // Green variance if under budget
    localStorage.setItem("fflow-budgets-v1", JSON.stringify({ Food: 900, "Rent/House": 900 }));
    render(<BudgetPlanner transactions={exampleTransactions} />);
    expect(screen.queryByText(/\(exceeds\)/i)).toBeNull();
    // Variance present for category
    expect(screen.getByText(/\+?\$200\.00/)).toBeInTheDocument(); // For Food
  });

  it("prevents raising a category budget if it would push total above income", async () => {
    // Arrange with low income
    const lowIncomeTx = [
      { id: "tx1", type: "income", amount: 100, date: "2024-06-05" }
    ];
    localStorage.setItem("fflow-budgets-v1", JSON.stringify({ Food: 80 }));
    render(<BudgetPlanner transactions={lowIncomeTx} showToast={jest.fn()} />);
    // Edit Food, raise to 150 (exceeds)
    const editBtns = screen.getAllByRole("button", { name: /edit budget for/i });
    fireEvent.click(editBtns[0]);
    const input = screen.getByLabelText(/Budget for Food/);
    fireEvent.change(input, { target: { value: "150" } });
    // Try to save
    fireEvent.click(screen.getByRole("button", { name: /save budget for Food/i }));
    // Should block and show error message
    expect(
      screen.getByText(/Cannot set this budget/i)
    ).toBeInTheDocument();
  });

  it("correctly allows reduction of a budget even if already over income", async () => {
    const testTx = [
      { id: "tx1", type: "income", amount: 300, date: "2024-06-05" }
    ];
    localStorage.setItem("fflow-budgets-v1", JSON.stringify({ Food: 200, Shopping: 200 }));
    render(<BudgetPlanner transactions={testTx} />);
    // Try to lower "Shopping" to 50, which should be allowed
    const editBtns = screen.getAllByRole("button", { name: /edit budget for/i });
    // Find Shopping
    const index = editBtns.findIndex(e => e.parentElement.parentElement.textContent.includes("Shopping"));
    fireEvent.click(editBtns[index]);
    const input = screen.getByLabelText(/Budget for Shopping/);
    fireEvent.change(input, { target: { value: "50" } });
    // Save
    fireEvent.click(screen.getByRole("button", { name: /save budget for Shopping/i }));
    // No error message
    expect(screen.queryByText(/Cannot set this budget/i)).toBeNull();
  });

  it("handles zero-income months gracefully", () => {
    const tx = []; // No income for the month
    render(<BudgetPlanner transactions={tx} />);
    expect(screen.getByText(/Income this Month:/)).toHaveTextContent("$0.00");
    // Should not crash or show false warnings
    expect(screen.queryByText(/exceed your income/i)).toBeNull();
  });
});

