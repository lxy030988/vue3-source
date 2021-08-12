import { isFunction, isObject, ShapeFlags } from '@vue/shared'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

export function createComponentInstance(vnode: any) {
  const instance = {
    //组件实例
    vnode,
    type: vnode.type,
    props: {}, //vnode.props包含 props和attrs
    attrs: {},
    slots: {},
    setupState: {}, //如果setup返回一个对象，这个对象会作为setupState
    ctx: {},
    data: {},
    children: {},
    render: null,
    isMounted: false //默认组件没有挂载
  }
  instance.ctx = { _: instance }
  return instance
}

type TInstance = ReturnType<typeof createComponentInstance> & {
  [key: string]: any
}

export function setupComponent(instance: TInstance) {
  const { props, children, shapeFlag } = instance.vnode
  //根据props解析出 props和attrs  将其放到instance上
  instance.props = props //initProps()
  instance.children = children //插槽的解析 initSlot()

  //需要先看下 当前组件是不是有状态组件， 函数组件
  let isStateful = shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    //是一个带状态的组件
    //调用当前实例的setup方法  用setup的返回值填充 setupState和render
    setupStatefulComponent(instance)
  }
}

function setupStatefulComponent(instance: TInstance) {
  //1.代理 传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  //2.获取组件的类型 拿到组件的setup方法
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    let setupContext = createSetupContext(instance)
    const setupResult = setup(instance.props, setupContext)
    handelSetupResult(instance, setupResult)
    // render(instance.proxy)
  } else {
    finishComponentSetup(instance)
  }
}

function createSetupContext(instance: TInstance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

//instance 表示组件的状态  组件的相关信息
//ctx 就是4个参数 为了开发时使用
//proxy 为了取值方便

function handelSetupResult(instance: TInstance, setupResult: any) {
  if (isFunction(setupResult)) {
    instance.render = setupResult //获取render方法
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: TInstance) {
  const Component = instance.type
  if (!instance.render) {
    if (!Component.render && Component.template) {
      // Component.render = compile(Component.template) 编译成render函数
    }
    instance.render = Component.render
  }

  //vue3 是兼容vue2的 data watch ...   applyOptions() vue2 和 vue3 中 setup的返回值做合并
}
