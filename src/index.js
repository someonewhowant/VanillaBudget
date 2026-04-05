import { router } from './core/router.js';
import { Dashboard } from './components/Dashboard.js';
import { Transactions } from './components/Transactions.js';
import { Budget } from './components/Budget.js';
import { Settings } from './components/Settings.js';

// Setup routes
router
  .addRoute('/', Dashboard)
  .addRoute('/transactions', Transactions)
  .addRoute('/budget', Budget)
  .addRoute('/settings', Settings)
  .start();
