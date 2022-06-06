import { reactive } from '../reactive/reactive'
import { effect } from '../reactive/effect'
import { normalizeVnode } from '../runtime/vnode'
import { patch } from '../runtime/render'
import { queueJob } from './scheduler'

export function mountComponent(vnode, container, anchor) {
  const { type: originalComp } = vnode

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
  instance.setupState = originalComp.setup?.(instance.props, { attrs: instance.attrs })

  // vue源码此处使用proxy代码实现
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  instance.update = effect(() => {
    if (!instance.isMounted) {
      // mount
      const subTree = instance.subTree = normalizeVnode(originalComp.render(instance.ctx));
      if (Object.keys(instance.attrs)) {
        subTree.props = {
          ...subTree.props,
          ...instance.attrs
        };
      }
      patch(null, subTree, container, anchor);
      instance.isMounted = true;
      vnode.el = subTree.el;
    } else {
      // update

      // instance.next存在，代表是被动更新。否则是主动更新
      if (instance.next) {
        vnode = instance.next;
        instance.next = null;
        instance.props = reactive(instance.props);
        initProps(instance, vnode);
        instance.ctx = {
          ...instance.props,
          ...instance.setupState
        };
      }

      const prev = instance.subTree;
      const subTree = instance.subTree = normalizeVnode(originalComp.render(instance.ctx));
      if (Object.keys(instance.attrs)) {
        subTree.props = {
          ...subTree.props,
          ...instance.attrs
        };
      }
      // anchor may have changed if it's in a fragment
      patch(prev, subTree, container, anchor);
      vnode.el = subTree.el;
    }
  }, {
    scheduler: queueJob
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
