import { NodeTypes } from './parse'
import { helperNameMap, OPEN_BLOCK } from './runtimeHelpers'
import { RootNode } from './transform'

function createCodegenContext(ast: RootNode) {
  const context = {
    code: '', //结果
    push(c: string) {
      context.code += c
    },
    indentLevel: 0,
    helper(key: any) {
      return `${helperNameMap[key]}`
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },
    newline() {
      newline(context.indentLevel)
    }
  }

  function newline(n: number) {
    context.push('\n' + `  `.repeat(n))
  }

  return context
}
function genVNodeCall(node: any, context: any) {
  const { isBlock } = node
  const { push, helper } = context
  if (isBlock) {
    push(`${helper(OPEN_BLOCK)}()`)
  }
  console.log('genVNodeCall')
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.TEXT:
      // genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      break
    case NodeTypes.INTERPOLATION:
      break
    case NodeTypes.TEXT_CALL:
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      break
    case NodeTypes.COMMENT:
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      break
  }
}

export function generate(ast: RootNode) {
  const context = createCodegenContext(ast)
  const { push, indent, deindent, newline } = context
  push('const _Vue = Vue')
  newline()
  push('function render(_ctx) {')
  indent()
  push('with (_ctx) {')
  indent()
  push(
    `const { ${ast.helpers
      .map((s) => `${helperNameMap[s]}`)
      .join(', ')} } = _Vue`
  )
  newline()
  push('return ')
  genNode(ast.codegenNode, context)
  deindent()
  push('}')
  deindent()
  push('}')
  return context.code
}
