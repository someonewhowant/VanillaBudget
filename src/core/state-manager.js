/**
 * Zero Framework State Manager
 * A robust state management solution for Zero Framework applications
 */

class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.subscribers = new Set();
    this.middleware = [];
    this.isUpdating = false;
    
    // Create a proxy for the state
    this.proxy = new Proxy(this.state, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        
        // Run middleware
        this.middleware.forEach(middleware => {
          middleware(property, value, oldValue, target);
        });
        
        // Notify subscribers if state actually changed
        if (this.isUpdating || oldValue !== value) {
          this.notifySubscribers();
        }
        
        return true;
      },
      
      deleteProperty: (target, property) => {
        const oldValue = target[property];
        delete target[property];
        
        // Run middleware
        this.middleware.forEach(middleware => {
          middleware(property, undefined, oldValue, target);
        });
        
        // Notify subscribers
        this.notifySubscribers();
        return true;
      }
    });
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to be called when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  /**
   * Notify all subscribers about state changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }
  
  /**
   * Add middleware to the state manager
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get proxied state for component usage
   * @returns {Proxy} Proxied state
   */
  getProxy() {
    return this.proxy;
  }
  
  /**
   * Update state with a new object
   * @param {Object} newState - New state object
   */
  setState(newState) {
    this.isUpdating = true;
    Object.assign(this.state, newState);
    this.isUpdating = false;
    this.notifySubscribers();
  }
  
  /**
   * Update state with a function
   * @param {Function} updater - Function that takes current state and returns new state
   */
  update(updater) {
    this.isUpdating = true;
    const newState = updater(this.state);
    Object.assign(this.state, newState);
    this.isUpdating = false;
    this.notifySubscribers();
  }
  
  /**
   * Reset state to initial state
   */
  reset() {
    this.state = {};
    this.notifySubscribers();
  }
  
  /**
   * Reset state to initial state
   * @param {Object} initialState - New initial state
   */
  resetTo(initialState) {
    this.state = initialState;
    this.notifySubscribers();
  }
}

// Export singleton instance for global state management
export const stateManager = new StateManager();

// Export the StateManager class for advanced usage
export { StateManager };