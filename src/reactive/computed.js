import { isFunction } from '../utils'
import { effect, track, trigger } from './effect'

export function computed(getterOrOpt) {
  let getter, setter
  if (isFunction(getterOrOpt)) {
    getter = getterOrOpt
    setter = () => {
      console.warn('computed is readyonly')
    }
  } else {
    setter = getterOrOpt.set
    getter = getterOrOpt.get
  }
  return new ComputedImpl(getter, setter)
}

class ComputedImpl {
  constructor(getter, setter) {
    this._setter = setter
    this._value = undefined
    this._dirty = true
    this._effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        this._dirty = true
        trigger(this, 'value')
      }
    })
  } 

  get value() {
    if (this._dirty) {
      this._value = this._effect()
      this._dirty = false
      track(this, 'value')
    }
    return this._value
  }

  set value(newValue) {
    this._setter(newValue)
  }
}