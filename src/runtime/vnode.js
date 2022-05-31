import { isArray, isNumber, isString } from "../utils"

// 使用位运算
export const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

/**
 * 
 * @param { string | Object | Text | Fragment } type 
 * @param { Object | null } props 
 * @param { string | number | array | null } children 
 * @return vnode
 */
export function h(type, props, children) {
  let shapeFlags = 0
  if (isString(type)) {
    shapeFlags = ShapeFlags.ELEMENT
  } else if (type === Text) {
    shapeFlags = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlags = ShapeFlags.FRAGMENT
  } else {
    shapeFlags = ShapeFlags.COMPONENT
  }

  if (isString(children) || isNumber(children)) {
    shapeFlags |= ShapeFlags.TEXT_CHILDREN
    children = children.toString()
  } else if (isArray(children)) {
    shapeFlags |= ShapeFlags.ARRAY_CHILDREN
  }

  return {
    type,
    props,
    children,
    shapeFlags,
    el: null,
    anchor: null
  }
}
