const effectStack = []
let activeEffect = null 

export function effect(fn, options = {}) {
  const effectFn = () => {
    try {
      activeEffect = effectFn // // 记录当前正在执行的副作用函数
      effectStack.push(activeEffect) // 嵌套effect副作用函数
      return fn()
    } finally {
      // todo
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1] 
    }
  }
  if (!options.lazy) {
    effectFn()
  }
  effectFn.scheduler = options.scheduler
  return effectFn
}

const targetMap = new WeakMap()
export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  deps.add(activeEffect)
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps = depsMap.get(key)
  if (!deps) return
  deps.forEach(effectFn => {
    if (effectFn.scheduler) {
      effectFn.scheduler(effectFn)
    } else {
      effectFn()
    }
  });
}
