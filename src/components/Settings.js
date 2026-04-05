import { Zero, h } from '../core/zero.js';
import { Sidebar } from './Sidebar.js';
import { store } from '../store.js';

export class Settings extends Zero {
  constructor(props) {
    super(props);
    this.state = {
      user: store.getState().user
    };
    
    this.unsubscribe = store.subscribe(() => {
      this.state.user = store.getState().user;
    });
  }

  onUnmounted() {
    this.unsubscribe();
  }

  handleProfileSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.updateProfile({
      name: formData.get('name')
    });
    alert('Profile updated successfully!');
  }

  handleReset = () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      store.resetData();
    }
  }

  handleThemeChange = (theme) => {
    store.setTheme(theme);
  }

  render() {
    const { user } = this.state;
    const currentTheme = store.getState().theme;

    return h('div', { class: 'app-container' },
      h(Sidebar),
      h('main', { class: 'main-content' },
        h('header', { class: 'section-title' },
          h('h1', {}, 'Settings'),
          h('p', { style: 'font-size: 1rem; color: var(--text-dim); margin-top: 5px;' }, 'Manage your profile and application preferences.')
        ),
        
        h('div', { class: 'grid', style: 'grid-template-columns: 1fr 1fr; gap: 24px;' },
          h('div', { class: 'glass-card' },
            h('h3', { style: 'margin-bottom: 20px;' }, 'User Profile'),
            h('form', { onsubmit: this.handleProfileSubmit },
              h('div', { class: 'form-group' },
                h('label', {}, 'Full Name'),
                h('input', { 
                  type: 'text', 
                  name: 'name', 
                  value: user.name,
                  class: 'form-control',
                  required: true 
                })
              ),
              h('button', { type: 'submit', class: 'btn-primary' }, 'Save Profile')
            )
          ),

          h('div', { class: 'glass-card' },
            h('h3', { style: 'margin-bottom: 20px;' }, 'Appearance'),
            h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
              [
                { id: 'dark', name: 'Deep Space (Dark)', color: '#050505' },
                { id: 'light', name: 'Arctic (Light)', color: '#f0f2f5' },
                { id: 'blue', name: 'Cyber Ocean (Blue)', color: '#0a192f' }
              ].map(theme => h('label', { 
                style: `display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 8px; background: ${currentTheme === theme.id ? 'var(--border-glass)' : 'transparent'}; cursor: pointer; border: 1px solid ${currentTheme === theme.id ? 'var(--primary-blue)' : 'var(--border-glass)'};`
              },
                h('input', { 
                  type: 'radio', 
                  name: 'theme', 
                  checked: currentTheme === theme.id,
                  onclick: () => this.handleThemeChange(theme.id),
                  style: 'accent-color: var(--primary-blue);'
                }),
                h('div', { style: `width: 20px; height: 20px; border-radius: 50%; background: ${theme.color}; border: 1px solid #666;` }),
                h('span', {}, theme.name)
              ))
            )
          ),
          
          h('div', { class: 'glass-card' },
            h('h3', { style: 'margin-bottom: 20px;' }, 'Danger Zone'),
            h('p', { style: 'font-size: 0.9rem; color: var(--text-dim); margin-bottom: 20px;' }, 
              'This action will clear all your transaction history and budget settings. This cannot be undone.'
            ),
            h('button', { 
              onclick: this.handleReset,
              style: 'width: 100%; padding: 14px; background: #ff4d4d; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;' 
            }, 'Reset All Data')
          )
        )
      )
    );
  }
}
