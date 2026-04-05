import { Zero, h } from '../core/zero.js';
import { Sidebar } from './Sidebar.js';
import { BaseChart } from './BaseChart.js';
import { store } from '../store.js';

export class Budget extends Zero {
  constructor(props) {
    super(props);
    this.state = {
      budgets: store.getState().budgets,
      transactions: store.getState().transactions,
      isModalOpen: false,
      isGoalModalOpen: false,
      savingsGoal: store.getState().savingsGoal
    };
    
    this.unsubscribe = store.subscribe(() => {
      this.state.budgets = store.getState().budgets;
      this.state.transactions = store.getState().transactions;
      this.state.savingsGoal = store.getState().savingsGoal;
    });
  }

  onUnmounted() {
    this.unsubscribe();
  }

  toggleModal = () => {
    this.state.isModalOpen = !this.state.isModalOpen;
  }

  toggleGoalModal = () => {
    this.state.isGoalModalOpen = !this.state.isGoalModalOpen;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.setBudget(formData.get('category'), parseFloat(formData.get('amount')));
    this.toggleModal();
  }

  handleGoalSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.setSavingsGoal(parseFloat(formData.get('goal')));
    this.toggleGoalModal();
  }

  getSpentAmount(category) {
    return this.state.transactions
      .filter(t => t.category === category && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  render() {
    const { budgets, isModalOpen, isGoalModalOpen, savingsGoal } = this.state;
    const summary = store.getSummary();
    const currentBalance = summary.balance;
    const progressPercent = Math.min(Math.round((currentBalance / savingsGoal) * 100), 100);
    const remaining = Math.max(savingsGoal - currentBalance, 0);

    const chartData = {
      labels: budgets.map(b => b.category),
      datasets: [
        {
          label: 'Budget',
          data: budgets.map(b => b.amount),
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4
        },
        {
          label: 'Spent',
          data: budgets.map(b => this.getSpentAmount(b.category)),
          backgroundColor: '#bc13fe',
          borderRadius: 4
        }
      ]
    };

    return h('div', { class: 'app-container' },
      h(Sidebar),
      h('main', { class: 'main-content' },
        h('header', { class: 'section-title', style: 'display: flex; justify-content: space-between; align-items: center;' },
          h('div', {},
            h('h1', {}, 'Budget Planning'),
            h('p', { style: 'font-size: 1rem; color: var(--text-dim); margin-top: 5px;' }, 'Take control of your monthly spending.')
          ),
          h('button', { 
            onclick: this.toggleModal,
            style: 'padding: 12px 24px; background: var(--primary-blue); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;' 
          },
            h('i', { class: 'fas fa-plus' }),
            ' Set New Budget'
          )
        ),
        h('div', { class: 'grid', style: 'grid-template-columns: 1fr 1fr;' },
          h('div', { style: 'grid-column: span 2;' },
            h('div', { class: 'glass-card' },
              h('h3', { style: 'margin-bottom: 25px;' }, 'Monthly Budget Overview'),
              h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;' },
                budgets.map(b => {
                  const spent = this.getSpentAmount(b.category);
                  const percent = Math.min((spent / b.amount) * 100, 100);
                  const isOver = spent > b.amount;

                  return h('div', { key: b.category, style: 'padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px;' },
                    h('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 15px;' },
                      h('b', {}, b.category),
                      h('span', { style: `color: ${isOver ? '#ff4d4d' : 'var(--text-dim)'}` }, `${percent.toFixed(0)}%`)
                    ),
                    h('div', { class: 'progress-bar', style: 'height: 8px; background: rgba(255,255,255,0.05); margin-bottom: 15px;' },
                      h('div', { class: 'progress-fill', style: `width: ${percent}%; background: ${isOver ? '#ff4d4d' : 'var(--primary-blue)'};` })
                    ),
                    h('div', { style: 'display: flex; justify-content: space-between; font-size: 0.85rem;' },
                      h('span', {}, h('span', { style: 'color: var(--text-dim)' }, 'Spent: '), `$${spent.toLocaleString()}`),
                      h('span', {}, h('span', { style: 'color: var(--text-dim)' }, 'Budget: '), `$${b.amount.toLocaleString()}`)
                    )
                  );
                })
              )
            )
          ),
          h('div', { class: 'glass-card' },
            h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' },
              h('h3', {}, 'Savings Goal'),
              h('button', { 
                onclick: this.toggleGoalModal,
                style: 'background: none; border: none; color: var(--primary-blue); cursor: pointer; font-size: 0.8rem;' 
              }, 'Edit Goal')
            ),
            h('div', { style: 'text-align: center; padding: 10px 0;' },
              h('div', { style: 'font-size: 2.5rem; font-weight: 700; margin-bottom: 5px;' }, `${progressPercent}%`),
              h('p', { style: 'color: var(--text-dim); font-size: 0.9rem;' }, 'Goal Progress')
            ),
            h('div', { class: 'progress-bar', style: 'height: 12px; background: rgba(255,255,255,0.05); margin: 15px 0;' },
              h('div', { class: 'progress-fill', style: `width: ${progressPercent}%; background: linear-gradient(to right, #00c6ff, #0072ff);` })
            ),
            h('div', { style: 'display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 20px;' },
              h('span', {}, h('span', { style: 'color: var(--text-dim)' }, 'Current: '), `$${currentBalance.toLocaleString()}`),
              h('span', {}, h('span', { style: 'color: var(--text-dim)' }, 'Target: '), `$${savingsGoal.toLocaleString()}`)
            ),
            h('div', { style: 'padding: 15px; background: rgba(13, 89, 242, 0.1); border-radius: 8px; border-left: 4px solid var(--primary-blue);' },
              h('p', { style: 'font-size: 0.85rem;' }, 
                remaining > 0 
                  ? `You are $${remaining.toLocaleString()} away from your goal! 🚀`
                  : `Congratulations! You've reached your savings goal! 🥳`
              )
            )
          ),
          h('div', { class: 'glass-card' },
            h('h3', { style: 'margin-bottom: 20px;' }, 'Historical Performance'),
            h(BaseChart, {
              id: 'historical-performance-chart',
              type: 'bar',
              data: chartData,
              options: {
                scales: {
                  y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                  }
                }
              }
            })
          )
        )
      ),

      // Modals
      isModalOpen && h('div', { class: 'modal-overlay active', style: 'display: flex; align-items: center; justify-content: center;' },
        h('div', { class: 'modal-container' },
          h('div', { class: 'modal-header' },
            h('h2', {}, 'Set Category Budget'),
            h('button', { class: 'modal-close', onclick: this.toggleModal }, '×')
          ),
          h('form', { onsubmit: this.handleSubmit },
            h('div', { class: 'form-group' },
              h('label', {}, 'Category'),
              h('select', { name: 'category', class: 'form-control' },
                ['Food', 'Housing', 'Entertainment', 'Electronics', 'Groceries'].map(c => h('option', { value: c }, c))
              )
            ),
            h('div', { class: 'form-group' },
              h('label', {}, 'Monthly Limit ($)'),
              h('input', { type: 'number', name: 'amount', class: 'form-control', required: true })
            ),
            h('button', { type: 'submit', class: 'btn-primary', style: 'width: 100%; margin-top: 20px; padding: 12px; border-radius: 8px; border: none; background: var(--primary-blue); color: white; cursor: pointer;' }, 'Save Budget')
          )
        )
      ),

      isGoalModalOpen && h('div', { class: 'modal-overlay active', style: 'display: flex; align-items: center; justify-content: center;' },
        h('div', { class: 'modal-container' },
          h('div', { class: 'modal-header' },
            h('h2', {}, 'Edit Savings Goal'),
            h('button', { class: 'modal-close', onclick: this.toggleGoalModal }, '×')
          ),
          h('form', { onsubmit: this.handleGoalSubmit },
            h('div', { class: 'form-group' },
              h('label', {}, 'Target Amount ($)'),
              h('input', { 
                type: 'number', 
                name: 'goal', 
                value: savingsGoal,
                class: 'form-control', 
                required: true 
              })
            ),
            h('button', { 
              type: 'submit', 
              class: 'btn-primary', 
              style: 'width: 100%; margin-top: 20px; padding: 12px; border-radius: 8px; border: none; background: var(--accent-purple); color: white; cursor: pointer;' 
            }, 'Update Goal')
          )
        )
      )
    );
  }
}
