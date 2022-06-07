import { NodeTypes } from '.'
import { capitalize } from '../utils'

export function generate(ast) {
  const returns = traverseNode(ast)
  const code = `
  with(ctx) {
    const { h, Text, Fragment, renderList } = MiniVue;
    return ${returns}
  }
  `
  return code
}

function traverseNode(node, parent) {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0], node)
      }
      return traverseChildren(node)
    case NodeTypes.ELEMENT:
      return resolveElementASTNode(node, parent)
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

// 专门处理特殊指令
function resolveElementASTNode(node, parent) {
  const ifNode = pluck(node.directives, 'if') || pluck(node.directives, 'else-if')
  if (ifNode) {
    let consequent = resolveElementASTNode(node, parent)
    let alternate

    const { children } = parent
    let i = children.findIndex(child => child === node) + 1
    for(;i < children.length; i++) {
      const sibling = children[i]
      if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
        children.splice(i, 1)
        i--
        continue
      }
      if (sibling.type === NodeTypes.ELEMENT) {
        if (pluck(sibling.directives, 'else')
         || pluck(sibling.directives, 'else-if', false)) {
          alternate = resolveElementASTNode(sibling, parent)
          children.splice(i, 1)
        }
      }
      break
    }

    const { exp } = ifNode
    let condition = exp.content
    return `${condition} ? ${consequent} : ${alternate || createTextVNode()}`
  }
  // v-for
  const forNode = pluck(node.directives, 'for')
  // for
  if (forNode) {
    // (item, index) in items 
    const { exp } = forNode
    const [args, source] = exp.content.split(/\sin\s|\sof\s/)
    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(node, parent)}))`
  }
  return createElementVNode(node)
}

function createElementVNode(node) {
  const { children, tagType } = node
  const tag = tagType === NodeTypes.ELEMENT ? `"${node.tag}"` : `resolveComponent("${node.tag}")`

  const vModel = pluck(node.directives, 'model')
  if (vModel) {
    node.directives.push(
      {
        type: NodeTypes.DIRECTIVE,
        name: 'bind',
        exp: vModel.exp, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'value',
          isStatic: true,
        }, // 表达式节点
      },
      {
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `($event) => ${vModel.exp.content} = $event.target.value`,
          isStatic: false,
        }, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'input',
          isStatic: true,
        }, // 表达式节点
      }
    )
  }

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
    results.push(traverseNode(children[i], node))
  }
  return `[${results.join(', ')}]`
}

function pluck(directives, name, remove = true) {
  const index = directives.findIndex(dir => dir.name === name)
  const dir = directives[index]
  if (index > -1 && remove) {
    directives.splice(index, 1)
  }
  return dir
}