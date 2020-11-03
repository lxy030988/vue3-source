import { mutableHandelers } from "./baseHandlers";
import { isObject } from "../shared/index";

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandelers); //读取当前文件的依赖收集，当数据变化的时候，要从新执行effect
}

const proxyMap = new WeakMap();
function createReactiveObject(target: object, baseHandlers: object) {
  if (!isObject(target)) {
    return target;
  }

  const proxyed = proxyMap.get(target);
  if (proxyed) {
    return proxyed;
  }

  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy); //将代理的对象和代理后的结果做一个映射表
  return proxy;
}
