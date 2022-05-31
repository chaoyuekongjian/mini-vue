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
    patch(prevVnode, vnode, container)
  }
  container._vnode = vnode
}

function patch(prevVnode, vnode, container, anchor) {
  if (prevVnode && !isSameVnode(prevVnode, vnode)) {
    anchor = (prevVnode.anchor || prevVnode.el).nextSibling
    unmount(prevVnode)
    prevVnode = null
  }
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.COMPONENT) {
    processComponent(prevVnode, vnode, container, anchor)
  } else if (shapeFlags & ShapeFlags.Text) {
    processText(prevVnode, vnode, container, anchor)
  } else if (shapeFlags & ShapeFlags.FRAGMENT) {
    processFragment(prevVnode, vnode, container, anchor)
  } else {
    processElement(prevVnode, vnode, container, anchor)
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

function processComponent(prevVnode, vnode, container, anchor) {
  // todo
}

function unmountFragment(vnode) {
  // todo
  const { el: cur, anchor: end } = vnode
  const { parentNode } = cur
  while (cur !== end) {
    let next = cur.nextSibling
    parentNode.removeChild(cur)
    cur = next
  }
  parentNode.removeChild(end)
}

function processText(prevVnode, vnode, container, anchor) {
  // todo
  if (prevVnode) {
    vnode.el = prevVnode.el
    prevVnode.el.textContent = vnode.children
  } else {
    mountTextNode(vnode, container, anchor)
  }
}

function processFragment(prevVnode, vnode, container, anchor) {
  const fragmentStartAnchor = document.createTextNode('')
  const fragmentEndAnchor = document.createTextNode('')
  if (!prevVnode) {
    vnode.el = fragmentStartAnchor
    vnode.anchor = fragmentEndAnchor
  } else {
    vnode.el = prevVnode.el
    vnode.anchor = prevVnode.anchor
  }
  // todo
  if (prevVnode) {
    patchChildren(prevVnode, vnode, container, fragmentEndAnchor)
  } else {
    container.insertBefore(fragmentStartAnchor, anchor)
    container.insertBefore(fragmentEndAnchor, anchor)
    mountChildren(vnode.children, container, fragmentEndAnchor)
  }
}

function processElement(prevVnode, vnode, container, anchor) {
  // todo
  if (prevVnode) {
    patchElement(prevVnode, vnode)
  } else {
    mountElement(vnode, container, anchor)
  }
}

function isSameVnode(n1, n2) {
  return n1.type === n2.type
}

// 挂载文本节点
export function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children)
  // container.appendChild(textNode)
  container.insertBefore(textNode, anchor)
  vnode.el = textNode
}

export function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlags, children } = vnode
  const el = document.createElement(type)
  // mountProps(props, el)

  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el)
  } else if (shapeFlags && shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el)
  }

  if (props) {
    patchProps(null, props, el)
  }

  // container.appendChild(el)
  // console.log(container, el, anchor)
  container.insertBefore(el, anchor)
  vnode.el = el
}

export function mountChildren(children, container, anchor) {
  children.forEach(child => {
    // mount(child, container)
    patch(null, child, container, anchor)
  })
}

function patchElement(prevVnode, vnode) {
  vnode.el = prevVnode.el
  patchProps(prevVnode.props, vnode.props, vnode.el)
  patchChildren(prevVnode, vnode, vnode.el)
}

function patchChildren(prevVnode, vnode, container, anchor) {
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
      mountChildren(vnode.children, container, anchor)
    } else if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      // patchArrayChildren
      patchArrayChildren(prevChildren, children, container, anchor)
    } else {
      mountChildren(vnode.children, container, anchor)
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
function patchArrayChildren(prevChildren, children, container, anchor) {
  const prevLength = prevChildren.length
  const newLength = children.length
  const commonLength = Math.min(prevLength, newLength)
  for(let i = 0; i < commonLength; i++) {
    patch(prevChildren[i], children[i], container, anchor)
  }
  if (prevLength > newLength) {
    unmountChildren(prechildChildren.slice(commonLength))
  } else if (prevLength < newLength) {
    mountChildren(children.slice(commonLength), container, anchor)
  }
}