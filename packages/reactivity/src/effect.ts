// import { isArray, isInt } from "../shared/index";

import { TrackOpTypes } from './operators'

//effect => vue2 watcher
export function effect(fn: Function, options: any = {}) {
  //将这个effect变成响应式的effect，可以做到数据的变化重新执行
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    //默认先执行一次effect
    effect()
  }
  return effect
}

let activeEffect: any //用来存储当前的effect函数
let uid = 0
const effectStack: Array<any> = [] //解决effect嵌套问题
function createReactiveEffect(fn: Function, options: object = {}): Function {
  const effect = function () {
    //防止递归执行
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect
        effectStack.push(activeEffect)
        //用户写的逻辑，内部会对数据进行取值操作，在取值时 可以拿到这个activeEffect
        return fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = uid++
  effect._isEffect = true //用于标识这是一个响应式的effect
  effect.row = fn //保留effect对应的原函数
  // effect.deps = [] //用来表示 effect 中依赖了哪些属性
  effect.options = options
  return effect
}

//将属性和effect做一个关联 {object:{key:[effect,effect]}}
//WeakMap key {name:'lxy',age:22} => value map(key:[effect,effect])
const targetMap = new WeakMap()
export function track(target: object, type: TrackOpTypes, key: PropertyKey) {
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    // activeEffect.deps.push(dep)
  }
  console.log('targetMap 依赖', targetMap)
}

// //触发视图更新操作
// export function trigger(type, target, key, value?, oldValue?) {
//   const depsMap = targetMap.get(target)
//   if (!depsMap) {
//     return
//   }

//   const run = (effects) => {
//     if (effects) {
//       // effects.forEach((effect) => effect());
//       const baseEffects = []
//       const computedRunners = []
//       effects.forEach((effect) => {
//         if (effect.options.computed) {
//           computedRunners.push(effect)
//         } else {
//           baseEffects.push(effect)
//         }
//       })
//       baseEffects.forEach((effect) => effect())
//       computedRunners.forEach((computed) => computed())
//     }
//   }

//   //数组的特殊情况
//   if (key === 'length' && isArray(target)) {
//     depsMap.forEach((dep, key) => {
//       if (key == 'length' || key >= value) {
//         //如果改的长度 小于数组原有的长度时  应该更新视图
//         run(dep)
//       }
//     })
//   } else {
//     if (key != void 0) {
//       //对象的处理  说明修改了key
//       run(depsMap.get(key))
//     }
//   }

//   if (type === 'add') {
//     //数组 通过索引新增
//     if (isArray(target) && isInt(key)) {
//       run(depsMap.get('length'))
//       //因为页面中直接使用了数组也会对数组进行取值操作，会对length进行收集，新增属性时直接触发length即可
//     }
//   }
// }
