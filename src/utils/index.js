export function isObject(target) {
  return typeof target === 'object' && target != null
}

export function hasChanged(oldValue, value) {
  return oldValue !== value && !(Number.isNaN(oldValue) && Number.isNaN(value))
}

export function isArray(target) {
  return Array.isArray(target)
}

export function isFunction(target) {
  return typeof target === 'function' && target != null
}

export function isString(target) {
  return typeof target === 'string'
}

export function isNumber(target) {
  return typeof target === 'number'
}

export function isBoolean(target) {
  return typeof target === 'boolean'
}

export function camelize(value) {
  return value.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}
