import { Zero, h } from '../core/zero.js';
import { Sidebar } from './Sidebar.js';
import { store } from '../store.js';

export class Transactions extends Zero {
  constructor(props) {
    super(props);
    this.state = {
      transactions: store.getState().transactions,
      isModalOpen: false,
      summary: store.getSummary(),
      searchQuery: '',
      filterCategory: 'all'
    };
    
    this.unsubscribe = store.subscribe(() => {
      this.state.transactions = store.getState().transactions;
      this.state.summary = store.getSummary();
    });
  }

  onUnmounted() {
    this.unsubscribe();
  }

  handleSearch = (e) => {
    this.state.searchQuery = e.target.value.toLowerCase();
  }

  handleFilter = (e) => {
    this.state.filterCategory = e.target.value;
  }

  toggleModal = () => {
    this.state.isModalOpen = !this.state.isModalOpen;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTransaction = {
      id: Date.now(),
      vendor: formData.get('vendor'),
      category: formData.get('category'),
      account: formData.get('account'),
      date: formData.get('date'),
      amount: formData.get('amount'),
      type: formData.get('type')
    };
    
    store.addTransaction(newTransaction);
    this.toggleModal();
  }

  handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      store.deleteTransaction(id);
    }
  }

  render() {
    const { transactions, isModalOpen, summary, searchQuery, filterCategory } = this.state;
    
    const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.vendor.toLowerCase().includes(searchQuery) || 
                            t.category.toLowerCase().includes(searchQuery);
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    const progress = summary.income > 0 ? (summary.expense / summary.income) * 100 : 0;

    return h('div', { class: 'app-container' },
      h(Sidebar),
      h('main', { class: 'main-content' },
        h('header', { class: 'section-title', style: 'display: flex; justify-content: space-between; align-items: center;' },
          h('div', {},
            h('h1', {}, 'Transaction History'),
            h('p', { style: 'font-size: 1rem; color: var(--text-dim); margin-top: 5px;' }, 'A detailed log of your financial activities.')
          ),
          h('div', { style: 'display: flex; gap: 12px;' },
            h('button', { 
              onclick: this.toggleModal,
              class: 'btn-primary',
              style: 'padding: 12px 24px; background: var(--accent-purple); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;' 
            },
              h('i', { class: 'fas fa-plus' }),
              ' Add Transaction'
            )
          )
        ),
        
        h('div', { class: 'glass-card', style: 'margin-bottom: 24px; display: flex; gap: 15px; align-items: center; padding: 15px 24px;' },
          h('div', { style: 'flex: 1; position: relative;' },
            h('i', { class: 'fas fa-search', style: 'position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-dim);' }),
            h('input', { 
              type: 'text', 
              placeholder: 'Search vendor or category...',
              oninput: this.handleSearch,
              class: 'form-control',
              style: 'padding-left: 45px;'
            })
          ),
          h('select', { onchange: this.handleFilter, class: 'form-control', style: 'width: auto;' },
            h('option', { value: 'all' }, 'All Categories'),
            ['Food', 'Housing', 'Entertainment', 'Electronics', 'Income'].map(c => h('option', { value: c }, c))
          )
        ),

        h('div', { class: 'grid', style: 'grid-template-columns: 2fr 1fr;' },
          h('div', { class: 'glass-card' },
            h('table', { style: 'width: 100%; border-collapse: collapse;' },
              h('thead', {},
                h('tr', { style: 'text-align: left; color: var(--text-dim); font-size: 0.8rem; border-bottom: 1px solid var(--border-glass);' },
                  h('th', { style: 'padding-bottom: 15px;' }, 'VENDOR / CATEGORY'),
                  h('th', { style: 'padding-bottom: 15px;' }, 'DATE'),
                  h('th', { style: 'padding-bottom: 15px;' }, 'ACCOUNT'),
                  h('th', { style: 'padding-bottom: 15px; text-align: right;' }, 'AMOUNT'),
                  h('th', { style: 'padding-bottom: 15px; text-align: right;' }, 'ACTIONS')
                )
              ),
              h('tbody', {},
                filteredTransactions.length === 0 
                  ? h('tr', {}, h('td', { colspan: 5, style: 'padding: 20px; text-align: center; color: var(--text-dim);' }, 'No transactions found.'))
                  : filteredTransactions.map(t => h('tr', { key: t.id, style: 'border-bottom: 1px solid rgba(255,255,255,0.05);' },
                      h('td', { style: 'padding: 15px 0;' }, 
                        h('div', {}, h('b', {}, t.vendor)),
                        h('div', { style: 'font-size: 0.75rem; color: var(--text-dim);' }, t.category)
                      ),
                      h('td', { style: 'padding: 15px 0;' }, t.date),
                      h('td', { style: 'padding: 15px 0;' }, t.account),
                      h('td', { style: 'padding: 15px 0; text-align: right;', class: t.type === 'income' ? 'blue-glow' : 'purple-glow' }, 
                        `${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString()}`
                      ),
                      h('td', { style: 'padding: 15px 0; text-align: right;' },
                        h('button', { 
                          onclick: () => this.handleDelete(t.id),
                          style: 'background: none; border: none; color: #ff4d4d; cursor: pointer;' 
                        }, h('i', { class: 'fas fa-trash' }))
                      )
                    ))
              )
            )
          ),
          h('div', { style: 'display: flex; flex-direction: column; gap: 24px;' },
            h('div', { class: 'glass-card' },
              h('h3', { style: 'margin-bottom: 20px;' }, 'Monthly Summary'),
              h('div', { style: 'display: flex; flex-direction: column; gap: 15px;' },
                h('div', { style: 'padding: 15px; background: rgba(13, 89, 242, 0.1); border-radius: 8px; border-left: 4px solid var(--primary-blue);' },
                  h('p', { style: 'font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase;' }, 'Total Income'),
                  h('p', { class: 'blue-glow', style: 'font-size: 1.5rem; font-weight: 700;' }, `$${summary.income.toLocaleString()}`)
                ),
                h('div', { style: 'padding: 15px; background: rgba(188, 19, 254, 0.1); border-radius: 8px; border-left: 4px solid var(--accent-purple);' },
                  h('p', { style: 'font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase;' }, 'Total Expenses'),
                  h('p', { class: 'purple-glow', style: 'font-size: 1.5rem; font-weight: 700;' }, `$${summary.expense.toLocaleString()}`)
                )
              ),
              h('div', { style: 'margin-top: 25px;' },
                h('p', { style: 'font-size: 0.9rem; margin-bottom: 10px;' }, 'Income vs Expense'),
                h('div', { class: 'progress-bar', style: 'height: 12px; background: rgba(188, 19, 254, 0.3);' },
                  h('div', { class: 'progress-fill', style: `width: ${Math.min(progress, 100)}%; box-shadow: 0 0 10px rgba(13, 89, 242, 0.5);` })
                )
              )
            )
          )
        )
      ),
      isModalOpen && h('div', { class: 'modal-overlay active', style: 'display: flex; align-items: center; justify-content: center;' },
        h('div', { class: 'modal-container' },
          h('div', { class: 'modal-header' },
            h('h2', {}, 'Add Transaction'),
            h('button', { class: 'modal-close', onclick: this.toggleModal }, '×')
          ),
          h('form', { onsubmit: this.handleSubmit },
            h('div', { class: 'form-group' },
              h('label', {}, 'Vendor Name'),
              h('input', { type: 'text', name: 'vendor', class: 'form-control', required: true })
            ),
            h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 15px;' },
              h('div', { class: 'form-group' },
                h('label', {}, 'Category'),
                h('select', { name: 'category', class: 'form-control' },
                  ['Food', 'Housing', 'Entertainment', 'Electronics', 'Income'].map(c => h('option', { value: c }, c))
                )
              ),
              h('div', { class: 'form-group' },
                h('label', {}, 'Account'),
                h('select', { name: 'account', class: 'form-control' },
                  ['Visa Card', 'Cash', 'Direct Deposit'].map(a => h('option', { value: a }, a))
                )
              )
            ),
            h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 15px;' },
              h('div', { class: 'form-group' },
                h('label', {}, 'Date'),
                h('input', { type: 'date', name: 'date', class: 'form-control', required: true })
              ),
              h('div', { class: 'form-group' },
                h('label', {}, 'Amount ($)'),
                h('input', { type: 'number', step: '0.01', name: 'amount', class: 'form-control', required: true })
              )
            ),
            h('div', { class: 'form-group' },
              h('label', {}, 'Type'),
              h('div', { style: 'display: flex; gap: 20px; margin-top: 10px;' },
                h('label', { style: 'display: flex; align-items: center; gap: 8px;' },
                  h('input', { type: 'radio', name: 'type', value: 'expense', checked: true }), ' Expense'
                ),
                h('label', { style: 'display: flex; align-items: center; gap: 8px;' },
                  h('input', { type: 'radio', name: 'type', value: 'income' }), ' Income'
                )
              )
            ),
            h('button', { type: 'submit', class: 'btn-primary', style: 'width: 100%; margin-top: 20px; padding: 12px; border-radius: 8px; border: none; background: var(--accent-purple); color: white; cursor: pointer;' }, 'Save Transaction')
          )
        )
      )
    );
  }
}
