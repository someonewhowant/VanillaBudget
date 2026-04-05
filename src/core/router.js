/**
 * Zero Framework Router
 * A lightweight routing solution for Zero Framework applications
 */

import { mount } from './zero.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentParams = {};
    this.listeners = [];
    this.isListening = false;

    // Initialize router
    this.init();
  }

  /**
   * Initialize the router
   */
  init() {
    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('popstate', () => this.handleRouteChange());

    // Handle clicks on links with router attributes
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-router-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href') || link.getAttribute('data-router-link');
        if (href) {
          this.navigate(href);
        }
      }
    });
  }

  /**
   * Define a route
   * @param {string} path - Route path (e.g., '/', '/users/:id')
   * @param {Function} component - Component to render for this route
   * @param {Object} options - Additional options
   */
  addRoute(path, component, options = {}) {
    this.routes.set(path, { path, component, options });
    return this;
  }

  /**
   * Navigate to a specific route
   * @param {string} path - Path to navigate to
   * @param {Object} params - Route parameters
   * @param {boolean} replace - Whether to replace current entry in history
   */
  navigate(path, params = {}, replace = false) {
    // Store params for later use
    this.currentParams = params;

    const hash = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === hash) {
      this.handleRouteChange();
    } else {
      window.location.hash = hash;
    }
  }

  /**
   * Handle route change from browser events
   */
  handleRouteChange() {
    // Always use hash for routing in current implementation
    const hash = window.location.hash || '#/';
    let path = hash.substring(1) || '/';
    if (!path.startsWith('/')) path = '/' + path;
    this.processRoute(path);
  }

  /**
   * Process route matching and rendering
   * @param {string} path - Path to process
   */
  processRoute(path) {
    // Normalize path
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');

    // Try to match exact route first
    let matchedRoute = this.routes.get(normalizedPath);

    // If no exact match, try parameterized routes
    if (!matchedRoute) {
      for (const [routePath, routeConfig] of this.routes.entries()) {
        const match = this.matchRoute(routePath, normalizedPath);
        if (match) {
          matchedRoute = { ...routeConfig, params: match.params };
          break;
        }
      }
    }

    // Update current route info
    this.currentRoute = matchedRoute;

    // Trigger listeners
    this.notifyListeners(matchedRoute);

    // Render component if found
    if (matchedRoute && matchedRoute.component) {
      this.renderRoute(matchedRoute);
    }
  }

  /**
   * Match a route pattern with a path
   * @param {string} routePattern - Route pattern with parameters
   * @param {string} path - Path to match
   * @returns {Object|null} Match result with params or null
   */
  matchRoute(routePattern, path) {
    // Simple regex-based matching
    const routeParts = routePattern.split('/').filter(p => p);
    const pathParts = path.split('/').filter(p => p);

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        const paramName = routePart.substring(1);
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        return null;
      }
    }

    return { params };
  }

  /**
   * Render the matched route component
   * @param {Object} route - Route configuration
   */
  renderRoute(route) {
    const root = document.getElementById('app');
    if (root && route.component) {
      const props = { ...route.params, ...route.options.props };
      const instance = new route.component(props);

      mount(instance, root);
    }
  }

  /**
   * Get current route information
   * @returns {Object|null} Current route data
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get current route parameters
   * @returns {Object} Current route parameters
   */
  getCurrentParams() {
    return this.currentParams;
  }

  /**
   * Subscribe to route changes
   * @param {Function} callback - Callback function to be called on route change
   * @returns {Function} Unsubscribe function
   */
  onRouteChange(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners about route change
   * @param {Object} route - Route data
   */
  notifyListeners(route) {
    this.listeners.forEach(callback => {
      try {
        callback(route);
      } catch (error) {
        console.error('Error in route listener:', error);
      }
    });
  }

  /**
   * Get route by path
   * @param {string} path - Route path
   * @returns {Object|null} Route configuration
   */
  getRoute(path) {
    return this.routes.get(path) || null;
  }

  /**
   * Check if a route exists
   * @param {string} path - Route path
   * @returns {boolean} True if route exists
   */
  hasRoute(path) {
    return this.routes.has(path);
  }

  /**
   * Remove a route
   * @param {string} path - Route path to remove
   * @returns {boolean} True if route was removed
   */
  removeRoute(path) {
    return this.routes.delete(path);
  }

  /**
   * Get all routes
   * @returns {Array} Array of all routes
   */
  getAllRoutes() {
    return Array.from(this.routes.values());
  }

  /**
   * Start listening for route changes
   */
  start() {
    if (!this.isListening) {
      this.isListening = true;
      // Process current route on startup
      this.handleRouteChange();
    }
  }

  /**
   * Stop listening for route changes
   */
  stop() {
    this.isListening = false;
  }
}

// Export singleton instance for global router usage
export const router = new Router();

// Export the Router class for advanced usage
export { Router };