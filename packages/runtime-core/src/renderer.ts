import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'

//创建一个渲染器
export function createRenderer(rendererOptions: any) {
  const setupRenderEffect = (
    instance: any,
    initialVnode: any,
    container: any
  ) => {
    // effect(function componentEffect() {
    //   if (!instance.isMounted) {
    //     //渲染组件中的内容
    //     instance.subTree = instance.render && instance.render() //组件对应渲染的结果
    //     patch(null, instance.subTree, container)
    //     instance.isMounted = true
    //   } else {
    //     //更新逻辑
    //     const prev = instance.subTree
    //     const next = instance.render && instance.render()
    //     // console.log(prev, next);
    //     patch(prev, next, container)
    //   }
    // })
  }

  const mountComponent = (initialVnode: any, container: any) => {
    //组件渲染的流程  最核心的就是调用 setup 拿到返回值，获取render函数返回的结果回来进行渲染
    //1.先有实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode))
    //2.需要的数据解析到实例上
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

  const patch = (n1: any, n2: any, container: any) => {
    //针对不同的类型 做初始化操作
    const { shapeFlag } = n2

    // if (n1 && !isSameVnodeType(n1, n2)) {
    //   hostRemove(n1.el)
    //   n1 = null
    // }

    if (shapeFlag & ShapeFlags.ELEMENT) {
      //元素
      console.log('元素')
      // processElement(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      //组件
      console.log('组件')

      processComponent(n1, n2, container)
    }
  }

  const render = (vnode: any, container: any) => {
    console.log('vnode', vnode, container)
    //core的核心 根据不同的虚拟节点 创建对应的真实元素

    //默认调用render 可能是初始化流程
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}
