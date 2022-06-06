import { NodeTypes } from '.'

export function generate(ast) {
  return traverseNode(ast)
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
  return isStatic ? JSON.stringify(content) : content.content
}

function createInterElementVNode(node) {
  const { tag, children } = node
  if (!children.length) {
    return `h(${JSON.stringify(tag)})`
  } 
  let childrenStr = traverseChildren(node)
  return `h(${JSON.stringify(tag)}, null, ${childrenStr})`
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
  for(let i = 0; i < children.length; i++) {
    results.push(traverseNode(children[i]))
  }
  return `[${results.join(', ')}]`
}