import { Zero, h } from '../core/zero.js';

export class Sidebar extends Zero {
  render() {
    let hash = window.location.hash || '#/';
    let currentPath = hash.substring(1) || '/';
    if (!currentPath.startsWith('/')) currentPath = '/' + currentPath;
    
    return h('aside', { class: 'sidebar' },
      h('div', { class: 'logo' },
        h('i', { class: 'fas fa-rocket' }),
        h('span', {}, 'Vanilla Budget')
      ),
      h('nav', { class: 'nav-links' },
        h('a', { 
          href: '#/', 
          class: `nav-link ${currentPath === '/' ? 'active' : ''}` 
        },
          h('i', { class: 'fas fa-th-large' }),
          h('span', {}, 'Dashboard')
        ),
        h('a', { 
          href: '#/budget', 
          class: `nav-link ${currentPath === '/budget' ? 'active' : ''}` 
        },
          h('i', { class: 'fas fa-wallet' }),
          h('span', {}, 'Budget Planning')
        ),
        h('a', { 
          href: '#/transactions', 
          class: `nav-link ${currentPath === '/transactions' ? 'active' : ''}` 
        },
          h('i', { class: 'fas fa-exchange-alt' }),
          h('span', {}, 'Transactions')
        ),
        h('a', { href: '#', class: 'nav-link' },
          h('i', { class: 'fas fa-chart-pie' }),
          h('span', {}, 'Reports')
        ),
        h('a', { 
          href: '#/settings', 
          class: `nav-link ${currentPath === '/settings' ? 'active' : ''}` 
        },
          h('i', { class: 'fas fa-cog' }),
          h('span', {}, 'Settings')
        )
      )
    );
  }
}
