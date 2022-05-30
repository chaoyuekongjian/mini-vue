import { isBoolean } from "../utils";
import { ShapeFlags } from "./vnode";

export function render(vnode, container) {
  mount(vnode, container);
}

export function mount(vnode, container) {
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.ELEMENT) {
    mountElement(vnode, container)
  } else if (shapeFlags & ShapeFlags.TEXT) {
    mountTextNode(vnode, container)
  } else if (shapeFlags & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container)
  } else {
    mountComponent(vnode, container)
  }
}

export function mountElement(vnode, container) {
  const { type, props } = vnode
  const el = document.createElement(type)
  mountProps(props, el)
  mountChildren(vnode, el)
  container.appendChild(el)
}

export function mountTextNode(vnode, container) {
  const textNode = document.createTextNode(vnode.children)
  container.appendChild(textNode)
}

export function mountFragment(vnode, container) {
  mountChildren(vnode, container)
}

export function mountComponent(vnode, container) {

}

export function mountChildren(vnode, container) {
  const { shapeFlags, children } = vnode
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, container)
  } else if (shapeFlags && shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    children.forEach(child => {
      mount(child, container)
    });
  }
}


/**
 {
    class: 'a b',
    style: {
      color: 'red',
      fontSize: '14px',
    },
    onClick: () => console.log('click'),
    checked: '',
    custom: false
  }
 */
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
export function mountProps(props, el) {
  for (const key in props) {
    const value = props[key]
    switch(key) {
      case 'class': 
        el.className = value
        break
      case 'style':
        for(const styleName in value) {
          el.style[styleName] = value[styleName]
        }
        break
      default:
        // /^on[^a-z]/
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase()
          el.addEventListener(eventName, value)
        } else if (domPropsRE.test(key)) {
          if (value === '' && isBoolean(el[key])) {
            value = true
          }
          el[key] = value
        } else {
          if (value == null || value === false) {
            el.removeAttribute(key)
          } else {
            el.setAttribute(key, value)
          }
        }
        break
    }
  }
}