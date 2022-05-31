import { isBoolean } from "../utils"

export function patchProps(prevProps, props, el) {
  if (prevProps === props) return
  prevProps = prevProps || {}
  props = props || {}
  for(const key in props) {
    const next = props[key]
    const prev = prevProps[key]
    if (prev !== next) {
      patchDomProps(prev, next, key, el)
    }
  }
  for(const key in prevProps) {
    if (props[key] === null) {
      patchDomProps(prevProps[key], null, key, el)
    }
  }
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/
function patchDomProps(prev, next, key, el) {
  switch(key) {
    case 'class': 
      el.className = next || ''
      break
    case 'style':
      for(const styleName in next) {
        el.style[styleName] = next[styleName]
      }
      if (prev) {
        for(const styleName in prev) {
          if (next[styleName] === null) {
            el.style[styleName] = null
          }
        }
      }
      break
    default:
      // /^on[^a-z]/
      if (/^on[^a-z]/.test(key)) {
        const eventName = key.slice(2).toLowerCase()
        if (prev) {
          el.removeEventListener(eventName, prev)
        } 
        if (next) {
          el.addEventListener(eventName, next)
        }
      } else if (domPropsRE.test(key)) {
        if (next === '' && isBoolean(el[key])) {
          next = true
        }
        el[key] = next
      } else {
        if (next == null || next === false) {
          el.removeAttribute(key)
        } else {
          el.setAttribute(key, next)
        }
      }
      break
  }
}
