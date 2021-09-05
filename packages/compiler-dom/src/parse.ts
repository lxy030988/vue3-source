export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT
}

function isEnd(context: TContext) {
  //context.source ='' 解析完成
  const s = context.source
  if (context.source.startsWith('</')) {
    return true
  }
  return !s
}

function advanceSpaces(context: TContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseTag(context: TContext) {
  const start = getCursor(context)
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!
  const tag = match[1]
  advanceBy(context, match[0].length)
  advanceSpaces(context)

  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    isSelfClosing,
    tag,
    children: [{}],
    loc: getSelection(context, start)
  }
}

function parseElement(context: TContext) {
  //1.解析标签名
  const element = parseTag(context)

  //处理儿子
  const children = parseChildren(context) //有可能没有儿子 直接跳出  结束标签

  if (context.source.startsWith('</')) {
    parseTag(context) //解析关闭标签时 同时会移除关闭信息并更新偏移量
  }
  element.children = children
  element.loc = getSelection(context, element.loc.start)
  return element
}

function parseInterpolation(context: TContext) {
  //{{ name }}
  const start = getCursor(context) //获取表达式的start位置
  const closeIndex = context.source.indexOf('}}')
  advanceBy(context, 2)
  const innerStart = getCursor(context) // name 开头
  const innerEnd = getCursor(context) //结尾
  const rawContentLength = closeIndex - 2 //大括号中的内容长度 包含空格

  const preTrimContent = parseTextData(context, rawContentLength)
  const content = preTrimContent.trim()
  const startOffset = preTrimContent.indexOf(content)
  if (startOffset > 0) {
    //{{ name}} name前面有空格
    advancePositionWithMutation(innerStart, preTrimContent, startOffset)
  }
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset)
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset)
  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }
}

function getCursor(context: TContext) {
  const { column, line, offset } = context
  return { column, line, offset }
}

function advancePositionWithMutation(
  context: TContext | Position,
  source: string,
  len: number
) {
  //根据内容和结束索引来修改上下文信息
  let linesCount = 0
  let lastNewLinePos = -1
  for (let i = 0; i < len; i++) {
    if (source.charCodeAt(i) === 10 /* 换行 */) {
      linesCount++
      lastNewLinePos = i //换行后第一个人的位置
    }
  }
  context.offset += len //偏移量
  context.line += linesCount //行
  context.column = //列
    lastNewLinePos === -1 ? context.column + len : len - lastNewLinePos
}

function advanceBy(context: TContext, len: number) {
  const { source } = context
  advancePositionWithMutation(context, source, len)
  context.source = source.slice(len)
}

function parseTextData(context: TContext, endIndex: number) {
  const rawText = context.source.slice(0, endIndex)
  advanceBy(context, endIndex) //在context.source中把文本删除
  return rawText
}

type Position = ReturnType<typeof getCursor>

function getSelection(context: TContext, start: Position, end?: Position) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}

function parseText(context: TContext) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length //文本的整改长度
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  //有了结束位置 可以更新行列信息
  const start = getCursor(context)
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start)
  }
}

function parseChildren(context: TContext) {
  const nodes: any[] = []
  while (!isEnd(context)) {
    const s = context.source
    let node: any
    if (s[0] === '<') {
      //标签
      node = parseElement(context)
    } else if (s.startsWith('{{')) {
      //表达式
      node = parseInterpolation(context)
    } else {
      //文本
      node = parseText(context)
    }
    nodes.push(node)
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        nodes[i] = null
      } else {
        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
      }
    }
  }
  return nodes.filter(Boolean)
}
function createParserContext(content: string) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: content, //source会被不停的移除  等source为空的时候解析完毕
    originalSource: content //这个值不会变 记录传入的内容
  }
}
type TContext = ReturnType<typeof createParserContext>
export function baseParse(content: string) {
  //标识节点的信息 行 列 偏移量
  //每解析一段 就移除一部分
  const context = createParserContext(content)
  const start = getCursor(context)

  return createRoot(parseChildren(context), getSelection(context, start))
}

function createRoot(children: any[], loc: any) {
  return {
    type: NodeTypes.ROOT,
    children,
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: 0,
    temps: 0,
    codegenNode: undefined,
    loc
  }
}
