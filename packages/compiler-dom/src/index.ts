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
  return !s
}
function parseElement(context: TContext) {}
function parseInterpolation(context: TContext) {}

function getCursor(context: TContext) {
  const { column, line, offset } = context
  return { column, line, offset }
}

function advancePositionWithMutation(
  context: TContext,
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
      break
    } else if (s[0].startsWith('{{')) {
      //表达式
      node = parseInterpolation(context)
      break
    } else {
      //文本
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
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
function baseParse(content: string) {
  //标识节点的信息 行 列 偏移量
  //每解析一段 就移除一部分
  const context = createParserContext(content)
  return parseChildren(context)
}

export function baseCompile(template: string) {
  // 将模板转成ast树
  const ast = baseParse(template)
  return ast
}
