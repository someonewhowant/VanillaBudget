import { Zero, h } from '../core/zero.js';
import { Sidebar } from './Sidebar.js';
import { BaseChart } from './BaseChart.js';
import { store } from '../store.js';

export class Dashboard extends Zero {
  constructor(props) {
    super(props);
    this.state = {
      summary: store.getSummary(),
      recentTransactions: store.getState().transactions.slice(0, 5)
    };
    
    this.unsubscribe = store.subscribe(() => {
      this.state.summary = store.getSummary();
      this.state.recentTransactions = store.getState().transactions.slice(0, 5);
    });
  }

  onUnmounted() {
    this.unsubscribe();
  }

  render() {
    const { summary, recentTransactions } = this.state;
    const transactions = store.getState().transactions;
    
    // Prepare chart data for last 7 days using local time for consistency
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const dailySpending = last7Days.map(date => {
      return transactions
        .filter(t => t.date === date && t.type === 'expense')
        .reduce((sum, t) => {
          const val = parseFloat(t.amount);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
    });

    const chartData = {
      labels: last7Days.map(d => d.split('-').slice(1).reverse().join('.')),
      datasets: [{
        label: 'Daily Spending',
        data: dailySpending,
        borderColor: '#0d59f2',
        backgroundColor: 'rgba(13, 89, 242, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#0d59f2',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        borderWidth: 3
      }]
    };

    const topCategories = Object.entries(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const val = parseFloat(t.amount);
          acc[t.category] = (acc[t.category] || 0) + (isNaN(val) ? 0 : val);
          return acc;
        }, {})
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

    const totalExpense = summary.expense || 1;

    return h('div', { class: 'app-container' },
      h(Sidebar),
      h('main', { class: 'main-content' },
        h('header', { class: 'section-title', style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;' },
          h('div', {},
            h('h1', {}, `Welcome back, ${store.getState().user.name}`),
            h('p', { style: 'font-size: 1rem; color: var(--text-dim); margin-top: 5px;' }, "Here's your financial overview for today.")
          )
        ),
        h('div', { class: 'grid dash-grid' },
          h('div', { style: 'display: flex; flex-direction: column; gap: 24px;' },
            h('div', { class: 'glass-card balance-card' },
              h('div', { style: 'position: relative; z-index: 1;' },
                h('p', { style: 'text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-dim);' }, 'Total Balance'),
                h('h2', { style: 'font-size: 3rem; margin: 10px 0;' }, `$${summary.balance.toLocaleString()}`),
                h('div', { style: 'display: flex; gap: 20px;' },
                  h('div', {},
                    h('p', { style: 'font-size: 0.8rem; color: var(--text-dim);' }, 'Monthly Profit'),
                    h('h4', { style: 'font-size: 1.2rem;' }, `${summary.profit >= 0 ? '+' : ''}$${summary.profit.toLocaleString()}`)
                  ),
                  h('div', { style: 'width: 1px; background: var(--border-glass);' }),
                  h('div', {},
                    h('p', { style: 'font-size: 0.8rem; color: var(--text-dim);' }, 'Income'),
                    h('h4', { class: 'blue-glow', style: 'font-size: 1.2rem;' }, `$${summary.income.toLocaleString()}`)
                  ),
                  h('div', { style: 'width: 1px; background: var(--border-glass);' }),
                  h('div', {},
                    h('p', { style: 'font-size: 0.8rem; color: var(--text-dim);' }, 'Expense'),
                    h('h4', { class: 'purple-glow', style: 'font-size: 1.2rem;' }, `$${summary.expense.toLocaleString()}`)
                  )
                )
              )
            ),
            h('div', { class: 'glass-card' },
              h('h3', { style: 'margin-bottom: 25px;' }, 'Monthly Spending Trends'),
              h(BaseChart, { 
                key: 'dashboard-spending-chart',
                id: 'spending-trend-chart',
                type: 'line',
                data: chartData,
                options: {
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { 
                      beginAtZero: true, 
                      grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                      ticks: { color: 'rgba(255, 255, 255, 0.5)', padding: 10 }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: 'rgba(255, 255, 255, 0.5)', padding: 10 }
                    }
                  }
                }
              })
            )
          ),
          h('div', { style: 'display: flex; flex-direction: column; gap: 24px;' },
            h('div', { class: 'glass-card' },
              h('h3', { style: 'margin-bottom: 20px;' }, 'Top Categories'),
              h('ul', { style: 'list-style: none; display: flex; flex-direction: column; gap: 10px;' },
                topCategories.length === 0 
                  ? h('p', { style: 'color: var(--text-dim)' }, 'No expenses yet.')
                  : topCategories.map(([cat, amt]) => {
                    const percent = Math.round((amt / totalExpense) * 100);
                    return h('li', { key: cat, style: 'display: flex; justify-content: space-between;' },
                      h('span', {}, h('i', { class: 'fas fa-tag blue-glow', style: 'width: 25px;' }), ` ${cat}`),
                      h('b', {}, `${percent}%`)
                    );
                  })
              )
            )
          )
        ),
        h('div', { style: 'grid-column: span 2; margin-top: 24px;' },
          h('div', { class: 'glass-card' },
            h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;' },
              h('h3', {}, 'Recent Transactions'),
              h('a', { href: '#/transactions', style: 'color: var(--primary-blue); text-decoration: none; font-size: 0.9rem;' }, 'View All')
            ),
            h('table', { style: 'width: 100%; border-collapse: collapse;' },
              h('thead', {},
                h('tr', { style: 'text-align: left; color: var(--text-dim); font-size: 0.8rem; border-bottom: 1px solid var(--border-glass);' },
                  h('th', { style: 'padding-bottom: 15px;' }, 'VENDOR'),
                  h('th', { style: 'padding-bottom: 15px;' }, 'DATE'),
                  h('th', { style: 'padding-bottom: 15px;' }, 'AMOUNT'),
                  h('th', { style: 'padding-bottom: 15px;' }, 'STATUS')
                )
              ),
              h('tbody', {},
                recentTransactions.length === 0 
                  ? h('tr', {}, h('td', { colspan: 4, style: 'padding: 20px; text-align: center; color: var(--text-dim);' }, 'No transactions yet.'))
                  : recentTransactions.map(t => h('tr', { key: t.id, style: 'border-bottom: 1px solid rgba(255,255,255,0.05);' },
                      h('td', { style: 'padding: 15px 0;' }, t.vendor),
                      h('td', { style: 'padding: 15px 0;' }, t.date),
                      h('td', { style: 'padding: 15px 0;', class: t.type === 'income' ? 'blue-glow' : 'purple-glow' }, 
                        `${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString()}`
                      ),
                      h('td', { style: 'padding: 15px 0;' }, 
                        h('span', { style: 'padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); font-size: 0.75rem;' }, 'Completed')
                      )
                    ))
              )
            )
          )
        )
      )
    );
  }
}
