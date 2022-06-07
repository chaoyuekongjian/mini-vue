import { NodeTypes } from '.'
import { capitalize } from '../utils'

export function generate(ast) {
  const returns = traverseNode(ast)
  const code = `
  with(ctx) {
    const { h, Text, Fragment } = MiniVue;
    return ${returns}
  }
  `
  return code
}

function traverseNode(node) {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0])
      }
      return traverseChildren(node)
    case NodeTypes.ELEMENT:
      return createInterElementVNode(node)
    case NodeTypes.INTERPOLATION:
      return createInterPolationVNode(node)
    case NodeTypes.TEXT:
      return createTextVNode(node)
  }
}

function createTextVNode(node) {
  return `h(Text, null, ${createText(node)})`
}

function createInterPolationVNode(node) {
  return `h(Text, null, ${createText(node.content)})`
}

function createText({ isStatic = true, content = '' } = {}) {
  return isStatic ? JSON.stringify(content) : content
}

function createInterElementVNode(node) {
  const { children } = node
  const tag = JSON.stringify(node.tag)

  const propsArr = createPropsArr(node)
  const propsStr = propsArr.length ? `{ ${propsArr.join(', ')} }` : 'null'
  if (!children.length) {
    if (propsStr === 'null') {
      return `h(${tag})`
    }
    return `h(${tag}, ${propsStr})`
  }

  let childrenStr = traverseChildren(node)
  return `h(${tag}, ${propsStr}, ${childrenStr})`
}

function createPropsArr(node) {
  const { props, directives } = node
  return [
    ...props.map(prop => {
      return `${prop.name}: ${createText(prop.value)}`
    }),
    ...directives.map(dir => {
      switch (dir.name) {
        case 'bind':
          return `${dir.arg.content}: ${createText(dir.exp)}`
        case 'on':
          const eventName = `on${capitalize(dir.arg.content)}`

          let exp = dir.exp.content
          // 简单处理此处 判断是否是以括号结尾，并且不包含'=>'符号
          if (/\([^]*?\)$/.test(exp) && !exp.includes('=>')) {
            exp = `$event => (${exp})`
          }

          return `${eventName}: ${exp}`
        case 'html':
          return `innerHTML: ${createText(dir.exp)}`
        default:
          return `${dir.name}: ${createText(dir.exp)}`
      }
    })
  ]
}

function traverseChildren(node) {
  const { children } = node
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.TEXT) {
      return createText(child)
    } else if (child.type === NodeTypes.INTERPOLATION) {
      return createText(child.content)
    }
  }
  const results = []
  for (let i = 0; i < children.length; i++) {
    results.push(traverseNode(children[i]))
  }
  return `[${results.join(', ')}]`
}