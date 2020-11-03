import { isFunction } from "../shared/index";

export function createComponentInstance(vnode) {
  const instance = {
    type: vnode.type,
    props: {},
    vnode,
    render: null,
    setupState: null,
    isMounted: false, //默认组件没有挂载
  };
  return instance;
}

export function setupComponent(instance) {
  //1.对属性进行初始化
  //2.对插槽进行初始化

  //3.调用setup方法
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupResult = setup(); //获取setup的返回值
    //判断返回值类型
    handelSetupResult(instance, setupResult);
  }
}

function handelSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult; //获取render方法
  } else {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  } else if (!instance.render) {
    // compile(Component.template) 编译成render函数
  }

  //vue3 是兼容vue2的 data watch ...   applyOptions() vue2 和 vue3 中 setup的返回值做合并
}
