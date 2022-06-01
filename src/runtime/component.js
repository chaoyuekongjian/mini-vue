import { reactive } from '../reactive/reactive'
import { effect } from '../reactive/effect'
import { normalizeVnode } from '../runtime/vnode'
import { patch } from '../runtime/render'

export function mountComponent(vnode, container, anchor) {
  const { type: Component } = vnode

  // createComponentIntance
  const instance = vnode.Component = {
    props: {},
    attrs: {},
    setupState: null,
    ctx: null,
    mount: null,
    update: null,
    subTree: null,
    isMounted: false,
    next: null
  }

  initProps(instance, vnode)
  // 源码：instance.setupState = proxyRefs(setupResult)
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })

  // vue源码此处使用proxy代码实现
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  instance.update = effect(() => {
    if (instance.next && instance.isMounted) {
      // 被动更新
      vnode = instance.next
      instance.next = null
      initProps(instance, vnode)
      instance.ctx = {
        ...instance.props,
        ...instance.setupState
      }
    }
    const prev = instance.subTree
    const subTree = instance.subTree = normalizeVnode(Component.render(instance.ctx))
    fallThrough(instance, subTree)
    patch(instance.isMounted ? prev : null, subTree, container, anchor)
    vnode.el = subTree.el
    if (!instance.isMounted) {
      instance.isMounted = true
    }
  })
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs
    }
  }
}

function initProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode
  const props = instance.props = {}
  const attrs = instance.attrs = {}
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key]
    } else {
      attrs[key] = vnodeProps[key]
    }
  }

  instance.props = reactive(instance.props)
}