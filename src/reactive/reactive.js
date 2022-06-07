import { isObject, hasChanged, isArray } from '../utils'
import { track, trigger } from './effect'

const proxyMap = new WeakMap()
export function reactive(target) {
  if (!isObject(target)) {
    return target
  }
  if (isReactive(target)) { // 防止重复包裹  像 reactive(reactive(ob))
    return target
  }
  if (proxyMap.has(target)) { // 像let a = reactive(obj) let b = reactive(obj) 此处a和b返回的是同一个代码
    return proxyMap.get(target)
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true
      }
      const res = Reflect.get(target, key, receiver)
      track(target, key)
      return isObject(res) ? reactive(res) : res // 如果为对象则进行递归 否则直接返回
    },
    set(target, key, value, receiver) {
      let oldLength = target.length
      const oldValue = target[key]
      const res = Reflect.set(target, key, value, receiver)
      if (hasChanged(oldValue, value)) {
        console.log(target, key)
        trigger(target, key)
        if (isArray(target) && hasChanged(oldLength, target.length)) { // 如果target为数组
          trigger(target, 'length')
        }
      }
      return res
    }
  })

  proxyMap.set(target, proxy)
  return proxy
}

function isReactive(target) {
  return !!(target && target.__isReactive)
}

