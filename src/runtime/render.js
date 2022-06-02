import { isBoolean } from "../utils";
import { ShapeFlags } from "./vnode";
import { patchProps } from "./patchProps"
import { mountComponent } from "./component";

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

export function patch(prevVnode, vnode, container, anchor) {
  if (prevVnode && !isSameVnode(prevVnode, vnode)) {
    anchor = (prevVnode.anchor || prevVnode.el).nextSibling
    unmount(prevVnode)
    prevVnode = null
  }
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.COMPONENT) {
    processComponent(prevVnode, vnode, container, anchor)
  } else if (shapeFlags & ShapeFlags.TEXT) {
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

function unmountComponent(vnode) {
  unmount(vnode.Component.subTree)
}

function patchComponent(vnode) {
  // todo
}

function processComponent(prevVnode, vnode, container, anchor) {
  if (prevVnode) {
    // shouldComponentUpdate
    updateComponent(prevVnode, vnode)
  } else {
    mountComponent(vnode, container, anchor)
  }
}

function updateComponent(prevVnode, vnode) {
  vnode.Component = prevVnode.Component
  vnode.Component.next = vnode
  vnode.Component.update()
}

function unmountFragment(vnode) {
  // todo
  let { el: cur, anchor: end } = vnode
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
  const fragmentStartAnchor = (vnode.el = prevVnode ? prevVnode.el : document.createTextNode(''))
  const fragmentEndAnchor = (vnode.anchor = prevVnode ? prevVnode.anchor : document.createTextNode(''))
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
      // 只要第一个元素有key，就当做全部都有key  偷懒简化操作  正常情况下需要检查是否全部都有key
      if (prevChildren[0] && prevChildren[0].key != null
        && children[0] && children[0].key != null) {
          patchKeyedChildren(prevChildren, children, container, anchor)
      } else {
        patchUnkeyedChildren(prevChildren, children, container, anchor)
      }
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
function patchUnkeyedChildren(prevChildren, children, container, anchor) {
  const prevLength = prevChildren.length
  const newLength = children.length
  const commonLength = Math.min(prevLength, newLength)
  for(let i = 0; i < commonLength; i++) {
    patch(prevChildren[i], children[i], container, anchor)
  }
  if (prevLength > newLength) {
    unmountChildren(prevChildren.slice(commonLength))
  } else if (prevLength < newLength) {
    mountChildren(children.slice(commonLength), container, anchor)
  }
}

// 核心diff算法
function patchKeyedChildren2(prevChildren, children, container, anchor) {
  let maxNewIndexSoFar = 0
  const map = new Map()
  c1.forEach((item, j) => map.set(item.key, { item, j }))
  for(let i = 0; i < children.length; i++) {
    const next = children[i]
    let find = false
    const curAnchor = i === 0 ? prevChildren[0].el : children[i - 1].el.nextSibling
    if (map.has(next.key)) {
      find = true
      const { prev, j } = map.get(next.key)
      patch(prev, next, container, anchor)
      if (j < maxNewIndexSoFar) {
        container.insertBefore(next.el, curAnchor)
      } else {
        maxNewIndexSoFar = j
      }
      map.delete(next.key)
    } else {
      patch(null, next, container, curAnchor)
    }
  }
  map.forEach(({ prev }) => unmount(prev))
}


function patchKeyedChildren(prevChildren, children, container, anchor) {
  let i = 0
  let end1 = prevChildren.length - 1
  let end2 = children.length - 1

  // 从左至右依次比对
  while(i <= end1 && i <= end2 && prevChildren[i].key === children[i].key) {
    patch(prevChildren[i], children[i], container, anchor)
    i++
  }

  // 从右至左依次比对
  while(i <= end1 && i <= end2 && prevChildren[end1].key === children[end2].key) {
    patch(prevChildren[end1], children[end2], container, anchor)
    end1--
    end2--
  }

  //
  if (i > end1) {
    // 经过 1、2 直接将旧结点比对完，则剩下的新结点直接 mount，此时 i > e1
    for(let j = i; j <= end2; j++) {
      const nextPos = end2 + 1
      const curAnchor = (children[nextPos] && children[nextPos].el) || anchor
      patch(null, children[j], container, curAnchor)
    }
  } else if (i > end2) {
    // 经过 1、2 直接将旧结点比对完，则剩下的新结点直接 mount，此时 i > e1
    for(let j = i; j <= end1; j++) {
      unmount(prevChildren[j])
    }
  } else {
    // 若不满足 3，采用传统 diff 算法，但不真的添加和移动，只做标记和删除
    let maxNewIndexSoFar = 0
    let move = false
    const map = new Map()
    const source = new Array(end2 - i + 1).fill(-1)
    const toMounted = []
    for(let j = i; j < children.length; j++) {
      const prev = children[j]
      map.set(prev.key, { prev, j })
    }
    children.forEach((item, j) => map.set(item.key, { item, j }))
    for(let k = 0; k < source.length; k++) {
      const next = children[k + i]
      let find = false
      // const curAnchor = i === 0 ? prevChildren[0].el : children[i - 1].el.nextSibling
      if (map.has(next.key)) {
        find = true
        const { prev, j } = map.get(next.key)
        patch(prev, next, container, anchor)
        if (j < maxNewIndexSoFar) {
          move = true
          // container.insertBefore(next.el, curAnchor)
        } else {
          maxNewIndexSoFar = j
        }
        source[k] = j
        map.delete(next.key)
      } else {
        // todo
        toMounted.push(k + i)
        // patch(null, next, container, curAnchor)
      }
    }
    map.forEach(({ prev }) => unmount(prev))
    if (move) {
      // 需要移动，则采用新的最长上升子序列算法
      const seq = getSequence(source)
      let j = seq.length - 1
      for(let k = source.length - 1; k >= 0; k--) {
        if (source[k] === -1) {
          // mount
          const pos = k + i
          const nextPos = pos + 1
          const curAnchor = (children[nextPos] && children[nextPos].el) || anchor
          patch(null, children[pos], container, curAnchor)
        } else if (seq[j] === k) {
          // 不用移动
          j--
        } else {
          // 需要移动
          const pos = k + i
          const nextPos = pos + 1
          const curAnchor = (children[nextPos] && children[nextPos].el) || anchor
          container.insertBefore(children[pos].el, curAnchor)
        }
      }
    } else if (toMounted.length > 0) {
      for(let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k]
        const nextPos = pos + 1
        const curAnchor = (children[nextPos] && children[nextPos].el) || anchor
        patch(null, children[pos], container, curAnchor)
      }
    }
  }

}

// 最长上升子序列
function getSequence(nums) {
  let arr = [];
  let position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    // arr[arr.length - 1]可能为undefined，此时nums[i] > undefined为false
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
    } else {
      let l = 0,
        r = arr.length - 1;
      while (l <= r) {
        let mid = ~~((l + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
      position.push(l);
    }
  }
  let cur = arr.length - 1;
  // 这里复用了arr，它本身已经没用了
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur--] = i;
    }
  }
  return arr;
}