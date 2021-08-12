//提供domAPI方法  节点操作 属性操作
import { createRenderer } from '@vue/runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

//渲染时用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps)

// export { rendererOptions }

function ensureRenderer() {
  return createRenderer(rendererOptions)
}

export function createApp(rootComponent: any, rootProps = null) {
  // 1.根据组件 创建一个渲染器
  const app = ensureRenderer().createApp(rootComponent, rootProps)
  const { mount } = app
  app.mount = function (container: any) {
    //1.挂载时需要先将容器清空 再进行挂载
    container = nodeOps.querySelector(container)
    container.innerHTML = ''
    mount(container)
  }
  return app
}

export * from '@vue/runtime-core'
