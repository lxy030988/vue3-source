import { effect } from '@vue/reactivity'
import { TRendererOptions } from '@vue/runtime-dom'
import { invokeArrayFns, ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueIob } from './scheduler'
import { normalizeVNode, Text } from './vnode'

//创建一个渲染器
export function createRenderer(rendererOptions: TRendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    // createComment: hostCreateComment,
    // setText: hostSetText,
    setElementText: hostSetElementText,
    nextSibling: hostNextSibling
  } = rendererOptions

  //------------------组件--------------
  const setupRenderEffect = (
    instance: any,
    initialVnode: any,
    container: any
  ) => {
    //需要创建一个effect 在effect中调用render方法，这样render方法中拿到的数据会收集这个effect 属性更新时effect会重新执行

    instance.update = effect(
      function componentEffect() {
        //每个组件都有一个effect  vue3是组件级别更新  数据变化会重新执行对应组件的effect
        if (!instance.isMounted) {
          //初次渲染
          const { bm, m } = instance
          if (bm) {
            invokeArrayFns(bm)
          }

          let proxyToUse = instance.proxy
          //$vnode  _vnode
          //vnode  subTree
          instance.subTree =
            instance.render && instance.render.call(proxyToUse, proxyToUse) //组件对应渲染的结果
          // console.log('instance.subTree', instance.subTree)
          // 用render函数的返回值（vnode）继续渲染
          patch(null, instance.subTree, container)
          instance.isMounted = true

          if (m) {
            //mounted 要求必须在子组件完成后才会调用自己
            invokeArrayFns(m)
          }
        } else {
          //更新逻辑

          let { bu, u } = instance
          if (bu) {
            invokeArrayFns(bu)
          }

          let proxyToUse = instance.proxy

          const prev = instance.subTree
          const next =
            instance.render && instance.render.call(proxyToUse, proxyToUse)
          console.log('更新逻辑', prev, next)
          patch(prev, next, container)

          if (u) {
            invokeArrayFns(u)
          }
        }
      },
      {
        scheduler: queueIob
      }
    )
  }

  const mountComponent = (initialVnode: any, container: any) => {
    //组件渲染的流程  最核心的就是调用 setup 拿到返回值，获取render函数返回的结果回来进行渲染
    //1.先有实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode))
    //2.需要的数据解析到实例上 state props attrs render ...
    setupComponent(instance)
    //3.创建一个effect 让render函数执行
    setupRenderEffect(instance, initialVnode, container)
  }

  const processComponent = (n1: any, n2: any, container: any) => {
    if (n1) {
      // updateComponent(n1, n2, container)
    } else {
      //初次挂载
      mountComponent(n2, container)
    }
  }
  //------------------组件--------------

  //------------------处理元素--------------
  const mountChildren = (children: Array<any>, el: HTMLElement) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i])
      patch(null, child, el)
    }
  }

  const mountElement = (vnode: any, container: any, anchor: any) => {
    // 递归渲染
    const { shapeFlag, children, props, type } = vnode
    //将虚拟节点和真实节点做映射关系
    const el = (vnode.el = hostCreateElement(type))
    //渲染儿子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    //渲染属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    hostInsert(el, container, anchor)
  }

  const patchProps = (el: HTMLElement, oldProps: any, newProps: any) => {
    //比较属性
    if (oldProps !== newProps) {
      // 1.将新的属性 全部设置 以新的为准
      for (const key in newProps) {
        const oldProp = oldProps[key]
        const newProp = newProps[key]
        if (newProp !== oldProp) {
          hostPatchProp(el, key, oldProp, newProp)
        }
      }

      // 2.老的里有 新的里没有 需要删掉
      for (const key in oldProps) {
        if (!newProps.hasOwnProperty(key)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }

  const unmountChildren = (children: any[]) => {
    children.forEach((child) => unmount(child))
  }

  const patchKeyedChildren = (
    c1: Array<any>,
    c2: Array<any>,
    container: any
  ) => {
    //diff优化
    let i = 0 //都是默认从头开始比
    let e1 = c1.length - 1 // 老节点的最后一项index
    let e2 = c2.length - 1 // 新节点的最后一项index

    //尽可能减少比对的范围

    // (a b) c
    // (a b) d e
    //从头开始比 遇到不同的就停止了
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      i++
    }

    // a (b c)
    // d e (b c)
    //从尾开始比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      e1--
      e2--
    }

    //只考虑元素 新增和删除的情况
    // abc=> abcd (i=3,e1=2,e2=3)   abc=> dabc (i=0,e1=-1,e2=0)
    if (i > e1) {
      //老的少 新的多
      //新增元素
      if (i <= e2) {
        //表示新增的部分
        //根据e2取他的下一个元素 和 c2的长度比较
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        //从前面添加元素 | 从后面添加元素
        while (i <= e2) {
          patch(null, c2[i], container, anchor)
          i++
        }
      }
    }
    // (a b) c=>(a b)   i = 2, e1 = 2, e2 = 1
    // a (b c)=>(b c)   i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      //老的多新的少 删除元素
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      //无规律的 真正的diff
      // [i ... e1 + 1]: a b [c d e] f g
      // [i ... e2 + 1]: a b [e d c h] f g
      // i = 2, e1 = 4, e2 = 5
      const s1 = i
      const s2 = i
      const keyedToNewIndexMap = new Map()
      // 根据新节点 生成 key:index 映射表
      for (i = s2; i <= e2; i++) {
        //循环新节点
        const nextChild = c2[i]
        keyedToNewIndexMap.set(nextChild.key, i)
      }
      // console.log("keyedToNewIndexMap", keyedToNewIndexMap);
      const toBePatched = e2 - s2 + 1 //新节点diff部分的长度
      //去老的里面找 有一样的就复用
      //新的比老的多 添加   老的比新的多 删除
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0) //新老节点映射表
      for (i = s1; i <= e1; i++) {
        //循环老节点
        const prevChild = c1[i]
        const newIndex = keyedToNewIndexMap.get(prevChild.key)
        if (newIndex == undefined) {
          //老的有 新的没有 删除老节点
          unmount(prevChild)
        } else {
          //复用 并且比对属性
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, c2[newIndex], container)
        }
      }
      // console.log("newIndexToOldIndexMap", newIndexToOldIndexMap);

      //移动
      //获取不需要移动的最长个数   //最长递增子序列  数组push+二分查找
      const sequence = getSequence(newIndexToOldIndexMap)
      let j = sequence.length - 1
      // 移动 倒叙插入
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i //[e d c h]找到h的索引
        const nextChild = c2[nextIndex] //找到h
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null //[e d c h] f g 找到h的下一个元素
        if (newIndexToOldIndexMap[i] === 0) {
          //这是一个新元素 需要插入列表中  插入到某个元素的前面
          patch(null, nextChild, container, anchor)
        } else {
          //根据参照物 移动节点
          if (j < 0 || i !== sequence[j]) {
            hostInsert(nextChild.el, container, anchor)
          } else {
            //不需要移动的 直接跳过
            j--
          }
        }
      }
    }
  }

  const patchChildren = (n1: any, n2: any, el: any) => {
    const c1 = n1.children
    const c2 = n2.children
    //老的有儿子 新的没儿子  新的有儿子 老的没儿子  新老都有儿子   新老都是文本
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //新的是文本

      //老的是n个孩子 但是新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1) //如果c1中包含组件 会调用组件的销毁方法
      }

      //两个人都是文本的情况
      if (c1 != c2) {
        //直接用新的文本替换
        hostSetElementText(el, c2)
      }
    } else {
      //新的是元素  上一次有可能是文本 或者 数组

      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //都是数组 核心diff
          console.log('核心diff')
          patchKeyedChildren(c1, c2, el)
        } else {
          //新的没有孩子  null
          unmountChildren(c1)
        }
      } else {
        //老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          //移除老的文本
          hostSetElementText(el, '')
        }
        //新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //把新元素挂载上去
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchElement = (n1: any, n2: any, container: any) => {
    //元素是相同节点  n1 n2 type 一样就复用
    const el = (n2.el = n1.el)
    //更新属性
    patchProps(el, n1.props || {}, n2.props || {})
    // //更新儿子
    patchChildren(n1, n2, el)
  }

  const processElement = (n1: any, n2: any, container: any, anchor: any) => {
    if (n1) {
      patchElement(n1, n2, container)
    } else {
      //初次挂载
      mountElement(n2, container, anchor)
    }
  }
  //------------------处理元素--------------

  //------------------处理文本--------------
  const processText = (n1: any, n2: any, container: any) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }
  //------------------处理文本--------------

  const isSameVnodeType = (n1: any, n2: any) => {
    return n1.type === n2.type && n1.key === n2.key
  }

  const unmount = (n1: any) => {
    //如果是组件 调用组件的生命周期
    hostRemove(n1.el)
  }

  const patch = (n1: any, n2: any, container: any, anchor: any = null) => {
    if (n1 === n2) {
      return
    }

    //针对不同的类型 做初始化操作
    const { shapeFlag, type } = n2

    if (n1 && !isSameVnodeType(n1, n2)) {
      //把以前的删掉 换成n2
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null //重新渲染n2对应的内容
    }

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //元素
          // console.log('元素', n1, n2, container)
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //组件
          // console.log('组件', n1, n2, container)
          processComponent(n1, n2, container)
        }
    }
  }

  const render = (vnode: any, container: any) => {
    // console.log('vnode', vnode, container)
    //core的核心 根据不同的虚拟节点 创建对应的真实元素

    //默认调用render 可能是初始化流程
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
//贪心+二分查找
function getSequence(arr: number[]): number[] {
  //最长递增子序列的索引
  const p = arr.slice() //拷贝一个新数组
  const result = [0] //存的arr的索引
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j //将当前最后一项 放到P对应的索引上
        result.push(i)
        continue
      }
      //二分查找
      u = 0 //头
      v = result.length - 1 //尾
      while (u < v) {
        c = ((u + v) / 2) | 0 // | 0 取整
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      //当前这一项 比arr result中的二分查找结果的那个值小
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i //这里有可能后面的把前面的换掉了，导致结果有问题
      }
    }
  }

  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result //标记 结果是索引
}
