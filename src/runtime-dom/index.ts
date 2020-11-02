import { createRender } from "../runtime-core/index";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const renderOptions = { ...nodeOps, patchProp }; //dom操作

function ensureRenderer() {
  return createRender(renderOptions);
}

export function createApp(rootComponent) {
  console.log(rootComponent);
  // 1.根据组件 创建一个渲染器
  const app = ensureRenderer().createApp(rootComponent);
  const { mount } = app;
  app.mount = function (container: HTMLElement) {
    //1.挂载时需要先将容器清空 再进行挂载
    container.innerHTML = "";
    mount(container);
  };
  return app;
}

// createApp().createRender({nodeOps}) //重写渲染器
