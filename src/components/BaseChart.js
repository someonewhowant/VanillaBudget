import { Zero, h } from '../core/zero.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class BaseChart extends Zero {
  onMounted(element) {
    const canvas = element.querySelector('canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { type, data, options } = this.props;
    
    this._chart = new Chart(ctx, {
      type: type || 'line',
      data: data || { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750
        },
        ...options
      }
    });
  }

  onUpdated() {
    if (this._chart && this.props.data) {
      // Update labels
      this._chart.data.labels = this.props.data.labels;
      
      // Update datasets values without losing Chart.js metadata
      if (this.props.data.datasets) {
        this.props.data.datasets.forEach((newDataset, i) => {
          if (this._chart.data.datasets[i]) {
            Object.assign(this._chart.data.datasets[i], newDataset);
          } else {
            this._chart.data.datasets[i] = newDataset;
          }
        });
        
        // Remove extra datasets if any
        if (this._chart.data.datasets.length > this.props.data.datasets.length) {
          this._chart.data.datasets.splice(this.props.data.datasets.length);
        }
      }

      // Update options if they changed
      if (this.props.options) {
        Object.assign(this._chart.options, this.props.options);
      }
      
      this._chart.update('none'); // Update without animation for data sync
    }
  }

  onUnmounted() {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  }

  render() {
    // We use a simple block div to avoid flexbox measurement issues with Chart.js
    return h('div', { 
      class: 'chart-wrapper', 
      style: 'position: relative; height: 300px; width: 100%;' 
    },
      h('canvas', { id: this.props.id || `chart-${Math.random()}` })
    );
  }
}
