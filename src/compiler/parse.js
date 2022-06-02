import { isNativeTag, isVoidTag } from "./index";
import { NodeTypes, ElementTypes, createRoot } from "./ast";
import { camelize } from "../utils"

export function parse(content) {
  const context = createParserContext(content)
  const children = parseChildren(context)
  return createRoot(children)
}

function createParserContext(content) {
  return {
    options: {
      delimeters: ['{{', '}}'],
      isVoidTag, // 原生自闭合标签类型
      isNativeTag // 原生标签类型
    },
    source: content
  }
}

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    let node = null
    const s = context.source
    if (s.startsWith(context.options.delimeters[0])) {
      // parseInterpolation
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // parseElement
      node = parseElement(context)
    } else {
      // parseText
      node = parseText(context)
    }
    nodes.push(node)
  }

  let removed = false
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      // 区分文本节点是否全是空白
      if (/[^\t\r\n\f ]/.text(node.content)) {
        // 文本节点有一些字符
        node.content = node.content.replace(/[^\t\r\n\f ]+/g, ' ')
      } else {
        // 文本节点全是空白
        const prev = nodes[i - 1]
        const next = nodes[i + 1]
        if (!prev || !next || prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]+/.text(node.content)) {
          // 删除空白节点
          removed = true
          nodes[i] = null
        } else {
          node.content = ' '
        }
      }
    }
  }

  return removed ? nodes.filter(boolean) : nodes
}

function isEnd(context) {
  const s = context.source
  return s.startsWith('</') || !s
}

function parseInterpolation(context) {
  const [open, close] = context.options.delimeters
  advanceBy(context, open.length)

  const closeIndex = context.source.indexOf(close)
  const content = parseTextData(context, closeIndex).trim()
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: string,
      isStatic: false,
    } // 表达式节点
  }
}

function parseElement(context) {
  // parseTag start
  const element = parseTag(context)
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) return element // 还未判断<br> <input>的情况  这也可能是自闭合标签
  // parseChildren
  element.children = parseChildren(context)
  // parseTag end
  parseTag(context)

  return element
}

const tagReg = /^<\/?([a-z][^\t\r\n\f />]*)/i
function parseTag(context) {
  const match = tagReg.exec(context.source)
  console.log(match)
  const tag = match[1] // 不严谨 match可能为null  这里不做容错处理   这里默认认为正确的模板字符串

  advanceBy(context, match[0].length)
  advanceSpaces(context)

  const { props, directives } = parseAttributes(context)
  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  const tagType = isComponent(tag, context) ? ElementTypes.COMPONENT : ElementTypes.ELEMENT

  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  }
}

function isComponent(tag, context) {
  return !context.options.isNativeTag(tag)
}

function parseAttributes(context) {
  const props = []
  const directives = []
  while (context.source.length && !context.source.startsWith('/>') && !context.source.startsWith('>')) {
    let attr = parseAttribute(context) // 提取单个属性
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr)
    } else {
      props.push(attr)
    }
  }
  return { props, directives }
}

const attrReg = /^[^\t\r\n\f />][^\t\r\n\f />=]*/
function parseAttribute(context) {
  const match = attrReg.exec(context.source)
  const name = match[0]
  advanceBy(context, name.length)
  advanceSpaces(context)

  let value
  if (context.source[0] === '=') {
    advanceBy(context, 1) // 吃掉等号
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }

  // Directive
  if (/^[:|@|v-]/.test(name)) {
    let dirName, argContent
    if (name[0] === ':') {
      dirName = 'bind'
      argContent = name.slice(1)
    } else if (name[0] === '@') {
      dirName = 'on'
      argContent = name.slice(1)
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':')
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      }, // 表达式节点
      arg: argContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: camelize(argContent),
        isStatic: true,
      } // 表达式节点
    }
  }

  // attributes
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    } // 纯文本节点
  }
}

function parseAttributeValue(context) {
  let quote = context.source[0]
  advanceBy(context, 1)
  const endIndex = context.source.indexOf(queue)
  const content = parseTextData(context, endIndex)
  advanceBy(context, 1)
  advanceSpaces(context)
  return { content }
}

function parseTextData(context, length) {
  const text = context.source.slice(0, length)
  advanceBy(text, length)
  return text
}

// 缺陷: 不支持文本节点中带小于号
// a < b  
// </
function parseText(context) {
  const endTokens = ['<', context.options.delimeters[0]]
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i])
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function advanceBy(context, numOfCharacters) {
  context.source = context.source.slice(numOfCharacters)
}

// 吃掉空格
const reg = /[^\t\r\n\f ]+/ // 去掉空格的正则
function advanceSpaces(context) {
  const match = reg.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}