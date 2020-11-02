import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return (rootComponent) => {
    const app = {
      mount(container) {
        //和平台无关 用户调用的mount方法
        const vnode = createVnode(rootComponent);
        render(vnode, container);
      },
    };
    return app;
  };
}
