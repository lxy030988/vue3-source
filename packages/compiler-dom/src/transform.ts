import { baseParse, NodeTypes } from './parse'
import { PatchFlags } from '@vue/shared'
import {
  CREATE_BLOCK,
  CREATE_TEXT,
  CREATE_VNODE,
  FRAGMENT,
  OPEN_BLOCK,
  TO_DISPLAY_STRING
} from './runtimeHelpers'

function createVNodeCall(
  context: TransformContext,
  tag: any,
  props: any,
  children: any[],
  patchFlag: string | number
) {
  context.helper(CREATE_VNODE)
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag
  }
}

function transformElement(node: RootNode | any, context: TransformContext) {
  //希望在整个树处理完毕后 再处理元素
  if (node.type != NodeTypes.ELEMENT) {
    return
  }
  return () => {
    //退出函数 洋葱圈模型
    // console.log('处理元素的回调 要等所有子节点遍历完再执行')
    //createVnode('h1',{},'hello') 向helper中添加一个createVnode

    const { tag, children } = node
    let vnodeTag = `"${tag}"`
    let vnodeProps: any
    let vnodeChildren //处理好的儿子
    let patchFlag: number = 0 //用于标记这个标签是不是动态的
    let vnodePatchFlag: any

    if (children.length > 0) {
      if (node.children.length === 1) {
        const child = node.children[0]
        const type = child.type //是不是动态的
        const hasDynamicTextChild =
          type === NodeTypes.INTERPOLATION ||
          type === NodeTypes.COMPOUND_EXPRESSION
        if (hasDynamicTextChild) {
          patchFlag |= PatchFlags.TEXT
        }
        vnodeChildren = child
      } else {
        vnodeChildren = node.children //多个儿子 不用处理
      }
    }
    if (patchFlag !== 0) {
      vnodePatchFlag = patchFlag + ''
    }
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      vnodePatchFlag
    )
  }
}

function isText(node: any) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

function createCallExpression(callee: symbol, args: any[]) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args
  }
}

function transformText(node: RootNode, context: TransformContext) {
  // {{name}}  aaaa => [children,children] => createTextNode(name + 'hello')
  if (node.type == NodeTypes.ROOT || node.type == NodeTypes.ELEMENT) {
    return () => {
      //退出函数
      // console.log('处理文本的回调')
      const children = node.children
      let hasText = false
      let currentContainer: any

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          hasText = true //当前元素是文本 需要合并
          // 'aaa bbb' + name <div></div> + 'hello' + name
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child]
                }
              }
              currentContainer.children.push(` + `, next)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = null
              break
            }
          }
        }
      }

      //文本需要增加createText方法  helper
      //<div>hello</div>
      if (!hasText || children.length == 1) {
        //只有一个孩子 可以直接innerHTML 不用createText
        return
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs: any[] = [] //存放参数
          callArgs.push(child) //文本内容
          if (child.type !== NodeTypes.TEXT) {
            callArgs.push(PatchFlags.TEXT + '')
          }

          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              //用于生成代码
              context.helper(CREATE_TEXT),
              callArgs
            )
          }
        }
      }
    }
  }
  // console.log('transformText', node, context)
}

//树结构 树的每个节点进行转化
export function getBaseTransformPreset() {
  //很多转化方法
  return [transformElement, transformText]
}

function createTransformContext(
  root: RootNode,
  { nodeTransforms }: TransformOptions
) {
  const context = {
    root,
    currentNode: root,
    nodeTransforms,
    helpers: new Map(),
    helper(name: symbol) {
      //代码中用到了具体方法，需要调用此方法  讲对应的名字加到helpers
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }
  return context
}

function traverseChildren(node: RootNode, context: TransformContext) {
  //深度优先
  for (let i = 0; i < node.children.length; i++) {
    traverseNode(node.children[i], context)
  }
}

export type TransformContext = ReturnType<typeof createTransformContext>
function traverseNode(node: RootNode, context: TransformContext) {
  const { nodeTransforms } = context
  context.currentNode = node
  const exitFns = []

  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
    case NodeTypes.INTERPOLATION: //name => {obj:aaa} tostring
      context.helper(TO_DISPLAY_STRING)
      break
  }

  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

function createRootCodegen(root: RootNode, context: TransformContext) {
  const { helper } = context
  const { children } = root
  if (children.length === 1) {
    const child = children[0] //直接以当前这个节点作为根节点
    const codegenNode = child.codegenNode //获取元素转化后的codegen
    codegenNode.isBlock = true //只有一个儿子 那么他就是blocktree的根节点
    root.codegenNode = codegenNode //一个儿子 直接把儿子的codegen挂载到最外层上
  } else if (children.length > 1) {
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      children,
      PatchFlags.STABLE_FRAGMENT
    ) as any
    ;(root.codegenNode as any).isBlock = true
  }
  helper(CREATE_BLOCK)
  helper(OPEN_BLOCK)
}

export type RootNode = ReturnType<typeof baseParse>
type TransformOptions = {
  nodeTransforms: any[]
  [key: string]: any
}
export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  //根节点 在最外层包裹一 层
  createRootCodegen(root, context)
  // console.log('transform', context)
  root.helpers = [...context.helpers.keys()] as any //context属性 放到helpers上
}
