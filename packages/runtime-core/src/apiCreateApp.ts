import { createVnode } from './vnode'

export function createAppAPI(render: Function) {
  return (rootComponent: any, rootProps: any) => {
    // 告诉他 哪个组件 哪个属性来创建应用
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container: any) {
        //挂载的目的地

        // let vnode = {}
        // render(vnode, container)
        //1.根据组件创建虚拟节点
        //2.将虚拟节点和容器获取到后调用render方法

        //创建虚拟节点
        const vnode: any = createVnode(rootComponent, rootProps)
        //调用  render
        render(vnode, container)
        app._container = container
      }
    }
    return app
  }
}
