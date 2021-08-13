import { effect } from '@vue/reactivity'
import { TRendererOptions } from '@vue/runtime-dom'
import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueIob } from './scheduler'
import { normalizeVNode, Text } from './vnode'

//创建一个渲染器
export function createRenderer(rendererOptions: TRendererOptions) {
  const {
    insert: hostInsert,
    // remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    // createComment: hostCreateComment,
    // setText: hostSetText,
    setElementText: hostSetElementText
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
          let proxyToUse = instance.type
          //$vnode  _vnode
          //vnode  subTree
          instance.subTree =
            instance.render && instance.render.call(proxyToUse, proxyToUse) //组件对应渲染的结果
          // console.log('instance.subTree', instance.subTree)
          // 用render函数的返回值（vnode）继续渲染
          patch(null, instance.subTree, container)
          instance.isMounted = true
        } else {
          //更新逻辑
          console.log('更新逻辑')
          // const prev = instance.subTree
          // const next = instance.render && instance.render()
          // // console.log(prev, next);
          // patch(prev, next, container)
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

  const mountElement = (vnode: any, container: any) => {
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
    hostInsert(el, container)
  }

  const processElement = (n1: any, n2: any, container: any) => {
    if (n1) {
      //  patchElement(n1, n2)
    } else {
      //初次挂载
      mountElement(n2, container)
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

  const patch = (n1: any, n2: any, container: any) => {
    if (n1 === n2) {
      return
    }

    //针对不同的类型 做初始化操作
    const { shapeFlag, type } = n2

    // if (n1 && !isSameVnodeType(n1, n2)) {
    //   hostRemove(n1.el)
    //   n1 = null
    // }

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //元素
          console.log('元素', n1, n2, container)
          processElement(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //组件
          console.log('组件', n1, n2, container)

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
