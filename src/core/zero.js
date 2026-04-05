export function h(tag, props, ...children) {
  return {
    tag,
    props: props || {},
    children: children.flat().filter(c => c != null && c !== false)
  };
}

export class Zero {
  constructor(props) {
    this.props = props || {};
    this.state = {};
    this._vdom = null;
    this._dom = null;
    this._updateQueued = false;
    this._isProxied = false;
  }
  onCreated() { }
  onMounted(element) { }
  onUpdated() { }
  onUnmounted() { }
  render() { throw new Error("Component must implement a render() method."); }
}

function setupReactivity(instance) {
  if (instance._isProxied) return;
  
  const initialState = instance.state || {};
  instance.state = new Proxy(initialState, {
    set: (state, property, value) => {
      state[property] = value;
      if (!instance._updateQueued) {
        instance._updateQueued = true;
        requestAnimationFrame(() => {
          const currentEl = instance._dom;
          if (currentEl && currentEl.parentNode) {
            const newVdom = instance.render();
            const parent = currentEl.parentNode;
            const index = Array.from(parent.childNodes).indexOf(currentEl);
            if (index !== -1) {
              diff(parent, newVdom, instance._vdom, index);
              instance._vdom = newVdom;
            }
          }
          instance._updateQueued = false;
          instance.onUpdated();
        });
      }
      return true;
    },
    get: (state, property) => {
      return state[property];
    }
  });
  instance._isProxied = true;
}

export function createElement(vnode) {
  if (vnode === null || vnode === undefined || vnode === false) return document.createTextNode('');
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    const el = document.createTextNode(vnode.toString());
    el._vdom = vnode;
    return el;
  }

  const { tag, props, children = [] } = vnode;

  if (typeof tag === 'function') {
    if (tag.prototype instanceof Zero) {
      const instance = new tag(props);
      setupReactivity(instance);
      instance.onCreated();
      const subVnode = instance.render();
      const el = createElement(subVnode);
      instance._vdom = subVnode;
      instance._dom = el;
      el._componentInstance = instance;
      el._vdom = vnode;
      instance.onMounted(el);
      return el;
    } else {
      const subVnode = tag(props);
      const el = createElement(subVnode);
      el._functionalComponent = tag;
      el._vdom = vnode;
      el._subVdom = subVnode;
      return el;
    }
  }

  const el = document.createElement(tag);
  updateProps(el, props);
  children.forEach(child => el.appendChild(createElement(child)));
  el._vdom = vnode;
  return el;
}

export function updateProps(el, newProps = {}, oldProps = {}) {
  const allProps = { ...oldProps, ...newProps };
  Object.keys(allProps).forEach(key => {
    const oldValue = oldProps[key];
    const newValue = newProps[key];
    if (newValue === oldValue) return;
    
    if (key.startsWith('on')) {
      const eventName = key.toLowerCase().slice(2);
      if (oldValue) el.removeEventListener(eventName, oldValue);
      if (newValue) el.addEventListener(eventName, newValue);
    } else if (key === 'value' || key === 'checked') {
      el[key] = newValue;
    } else if (key === 'innerHTML') {
      el.innerHTML = newValue;
    } else if (key === 'style' && typeof newValue === 'string') {
      el.style.cssText = newValue;
    } else if (key === 'class' || key === 'className') {
      el.className = newValue;
    } else if (newValue == null || newValue === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newValue);
    }
  });
}

export function diff(parent, newVNode, oldVNode, index = 0) {
  const el = parent.childNodes[index];
  if (!oldVNode) {
    parent.appendChild(createElement(newVNode));
    return;
  }
  if (!newVNode) {
    if (el && el._componentInstance) el._componentInstance.onUnmounted();
    if (el) el.remove();
    return;
  }
  if (typeof newVNode !== typeof oldVNode || (typeof newVNode === 'string' && newVNode !== oldVNode) || newVNode.tag !== oldVNode.tag) {
    const componentInstance = el ? el._componentInstance : null;
    if (componentInstance) componentInstance.onUnmounted();
    
    const newEl = createElement(newVNode);
    parent.replaceChild(newEl, el);
    
    if (componentInstance) {
      componentInstance._dom = newEl;
      newEl._componentInstance = componentInstance;
      componentInstance.onMounted(newEl);
    }
    return;
  }
  if (typeof newVNode.tag === 'function') {
    if (el._componentInstance) {
      const instance = el._componentInstance;
      instance.props = newVNode.props;
      const nextVnode = instance.render();
      diff(parent, nextVnode, instance._vdom, index);
      instance._vdom = nextVnode;
      instance.onUpdated();
    } else if (el._functionalComponent) {
      const nextVnode = newVNode.tag(newVNode.props);
      diff(parent, nextVnode, el._subVdom, index);
      el._subVdom = nextVnode;
      el._vdom = newVNode;
    }
    return;
  }
  if (typeof newVNode.tag === 'string') {
    updateProps(el, newVNode.props, oldVNode.props);
    diffChildren(el, newVNode.children, oldVNode.children);
    el._vdom = newVNode;
  } else if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (newVNode.toString() !== oldVNode.toString()) el.textContent = newVNode.toString();
  }
}

function diffChildren(parent, newChildren, oldChildren) {
  const oldKeyed = new Map();
  oldChildren.forEach((child, i) => {
    if (child && child.props && child.props.key != null) {
      oldKeyed.set(child.props.key, { vnode: child, el: parent.childNodes[i] });
    }
  });

  const newKeyed = new Set();
  newChildren.forEach((child, i) => {
    if (child && child.props && child.props.key != null) {
      const key = child.props.key;
      newKeyed.add(key);
      if (oldKeyed.has(key)) {
        const { vnode, el } = oldKeyed.get(key);
        const currentIndex = Array.from(parent.childNodes).indexOf(el);
        if (currentIndex !== i) {
          parent.insertBefore(el, parent.childNodes[i]);
        }
        diff(parent, child, vnode, i);
      } else {
        parent.insertBefore(createElement(child), parent.childNodes[i]);
      }
    } else {
      diff(parent, child, oldChildren[i], i);
    }
  });

  oldKeyed.forEach(({ el }, key) => {
    if (!newKeyed.has(key)) {
      if (el._componentInstance) el._componentInstance.onUnmounted();
      el.remove();
    }
  });

  while (parent.childNodes.length > newChildren.length) {
    parent.lastChild.remove();
  }
}

export function mount(component, target) {
  if (target.firstChild && target.firstChild._componentInstance) {
    target.firstChild._componentInstance.onUnmounted();
  }
  target.innerHTML = '';
  const instance = component instanceof Zero ? component : null;
  if (instance) setupReactivity(instance);
  
  const vdom = instance ? instance.render() : component;
  const dom = createElement(vdom);
  target.appendChild(dom);
  
  if (instance) {
    instance._vdom = vdom;
    instance._dom = dom;
    dom._componentInstance = instance;
  }
}
