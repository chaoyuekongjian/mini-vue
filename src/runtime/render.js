import { isBoolean } from "../utils";
import { ShapeFlags } from "./vnode";
import { patchProps } from "./patchProps"

export function render(vnode, container) {
  const prevVnode = container._vnode
  if (!vnode) {
    if (prevVnode) {
      unmount(prevVnode)
    }
  } else {
    console.log(vnode)
    patch(prevVnode, vnode, container)
  }
  container._vnode = vnode
}

function patch(prevVnode, vnode, container) {
  if (prevVnode && !isSameVnode(prevVnode, vnode)) {
    unmount(prevVnode)
    prevVnode = null
  }
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.COMPONENT) {
    processComponent(prevVnode, vnode, container)
  } else if (shapeFlags & ShapeFlags.Text) {
    processText(prevVnode, vnode, container)
  } else if (shapeFlags & ShapeFlags.FRAGMENT) {
    processFragment(prevVnode, vnode, container)
  } else {
    processElement(prevVnode, vnode, container)
  }
}

function unmount(vnode) {
  const { shapeFlags, el } = vnode
  if (shapeFlags & ShapeFlags.COMPONENT) {
    unmountComponent(vnode)
  } else if (shapeFlags & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode)
  } else {
    // removeChild()
    el.parentNode.removeChild(el)
  }
}

function patchComponent(vnode) {
  // todo
}

function processComponent(prevVnode, vnode, container) {
  // todo
}

function unmountFragment(vnode) {
  // todo
}

function processText(prevVnode, vnode, container) {
  // todo
  if (prevVnode) {
    vnode.el = prevVnode.el
    prevVnode.el.textContent = vnode.children
  } else {
    mountTextNode(vnode, container)
  }
}

function processFragment(prevVnode, vnode, container) {
  // todo
  if (prevVnode) {
    patchChildren(prevVnode, vnode, container)
  } else {
    mountChildren(vnode.children, container)
  }
}

function processElement(prevVnode, vnode, container) {
  // todo
  if (prevVnode) {
    patchElement(prevVnode, vnode)
  } else {
    mountElement(vnode, container)
  }
}

function isSameVnode(n1, n2) {
  return n1.type === n2.type
}

// 挂载文本节点
export function mountTextNode(vnode, container) {
  const textNode = document.createTextNode(vnode.children)
  container.appendChild(textNode)
  vnode.el = textNode
}

export function mountElement(vnode, container) {
  const { type, props, shapeFlags, children } = vnode
  const el = document.createElement(type)
  // mountProps(props, el)
  patchProps(null, props, el)

  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el)
  } else if (shapeFlags && shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el)
  }
  container.appendChild(el)
  vnode.el = el
}

export function mountChildren(children, container) {
  children.forEach(child => {
    // mount(child, container)
    patchChildren(null, child, container)
  })
}

function patchElement(prevVnode, vnode) {
  vnode.el = prevVnode.el
  patchProps(prevVnode.props, vnode.props, vnode.el)
  patchChildren(prevVnode, vnode, vnode.el)
}

function patchChildren(prevVnode, vnode, container) {
  prevVnode = prevVnode || {}
  vnode = vnode || {}
  const { shapeFlags: prevShapeFlags, children: prevChildren } = prevVnode
  const { shapeFlags, children } = vnode
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren)
    }
    if (prevChildren !== children) {
      container.textContent = children
    }
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
      mountChildren(vnode.children, container)
    } else if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      // patchArrayChildren
      patchArrayChildren(prevChildren, children, container)
    } else {
      mountChildren(vnode.children, container)
    }
  } else {
    if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
    } else if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren)
    }
  }
}

function unmountChildren(children) {
  children.forEach(child => {
    // mount(child, container)
    // patchChildren(null, vnode, container)
    unmount(child)
  })
}
function patchArrayChildren(prevChildren, children, container) {
  const prevLength = prevChildren.length
  const newLength = children.length
  const commonLength = Math.min(prevLength, newLength)
  for(let i = 0; i < commonLength; i++) {
    patch(prevChildren[i], children[i], container)
  }
  if (prevLength > newLength) {
    unmountChildren(prechildChildren.slice(commonLength))
  } else if (prevLength < newLength) {
    mountChildren(children.slice(commonLength))
  }
}