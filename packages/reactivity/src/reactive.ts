import { isObject } from '@vue/shared'
import { mutableHandelers, readonlyHandelers, shallowReactiveHandelers, shallowReadonlyHandelers } from './baseHandlers'

export function reactive(target: object) {
  return createReactiveObject(target, false, mutableHandelers)
}
export function shallowReactive(target: object) {
  return createReactiveObject(target, false, shallowReactiveHandelers)
}
export function readonly(target: object) {
  return createReactiveObject(target, true, readonlyHandelers)
}
export function shallowReadonly(target: object) {
  return createReactiveObject(target, true, shallowReadonlyHandelers)
}

//只读？ 深度？
//使用柯里化
//new Proxy()  get set

const readonlyMap = new WeakMap()
const reactiveMap = new WeakMap()
export function createReactiveObject(target: object, isReadonly: boolean, baseHandlers: object) {
  if (!isObject(target)) {
    return
  }

  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const proxyed = proxyMap.get(target)
  if (proxyed) {
    return proxyed
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy) //将代理的对象和代理后的结果做一个映射表
  return proxy
}
