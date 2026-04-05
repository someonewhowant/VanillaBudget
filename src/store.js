import { StateManager } from './core/state-manager.js';

const initialState = {
  transactions: JSON.parse(localStorage.getItem('transactions')) || [],
  budgets: JSON.parse(localStorage.getItem('budgets')) || [
    { category: 'Food', amount: 500 },
    { category: 'Housing', amount: 1500 },
    { category: 'Entertainment', amount: 200 },
    { category: 'Electronics', amount: 300 },
    { category: 'Groceries', amount: 400 }
  ],
  theme: localStorage.getItem('theme') || 'dark',
  savingsGoal: parseFloat(localStorage.getItem('savingsGoal')) || 50000,
  user: {
    name: 'User',
    balance: 24500
  }
};

class AppStore extends StateManager {
  constructor(state) {
    super(state);
    this.subscribe(state => {
      localStorage.setItem('transactions', JSON.stringify(state.transactions));
      localStorage.setItem('budgets', JSON.stringify(state.budgets));
      localStorage.setItem('theme', state.theme);
      localStorage.setItem('savingsGoal', state.savingsGoal);
      this.applyTheme(state.theme);
    });
    // Apply theme on init
    this.applyTheme(this.state.theme);
  }

  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
  }

  setTheme(theme) {
    this.update(state => ({ ...state, theme }));
  }

  setSavingsGoal(amount) {
    this.update(state => ({ ...state, savingsGoal: amount }));
  }

  addTransaction(transaction) {
    this.update(state => ({
      ...state,
      transactions: [transaction, ...state.transactions]
    }));
  }

  deleteTransaction(id) {
    this.update(state => ({
      ...state,
      transactions: state.transactions.filter(t => t.id !== id)
    }));
  }

  setBudget(category, amount) {
    this.update(state => {
      const budgets = [...state.budgets];
      const index = budgets.findIndex(b => b.category === category);
      if (index > -1) {
        budgets[index] = { category, amount };
      } else {
        budgets.push({ category, amount });
      }
      return { ...state, budgets };
    });
  }

  updateProfile(userData) {
    this.update(state => ({
      ...state,
      user: { ...state.user, ...userData }
    }));
  }

  resetData() {
    localStorage.clear();
    location.reload();
  }

  getSummary() {
    const { transactions } = this.state;
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      income,
      expense,
      balance: this.state.user.balance + income - expense,
      profit: income - expense
    };
  }
}

export const store = new AppStore(initialState);
