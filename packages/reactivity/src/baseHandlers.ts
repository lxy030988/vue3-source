// 实现 new Proxy(target, baseHandlers)

import { hasOwn, isArray, isInt, isObject, isSymbol, needChanged } from '@vue/shared'
import { track, trigger } from './effect'
import { TrackTypes, TriggerTypes } from './operators'
import { reactive, readonly } from './reactive'

// 是不是只读的
// 是不是深度的

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: PropertyKey, receiver: any) {
    const res = Reflect.get(target, key, receiver) //target[key]
    //如果是symbol类型 忽略
    if (isSymbol(key)) {
      //数组中有很多symbol的内置方法
      return res
    }

    if (!isReadonly) {
      //依赖收集,等数据变化后更新对应的视图
      console.log('执行effect会取值，收集effect', key)
      track(target, TrackTypes.GET, key)
    }

    if (shallow) {
      return res
    }

    if (isObject(res)) {
      //取值是对象 再进行代理，懒递归
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}
function createSetter(shallow = false) {
  return function (target: object, key: string, value: any, receiver: any) {
    const oldValue = (<any>target)[key]
    //判断是否存在老值  数组 对象 两种情况
    const hasKey = isArray(target) && isInt(key) ? Number(key) < target.length : hasOwn(target, key)

    const res = Reflect.set(target, key, value, receiver)
    //区分新增还是修改
    if (hasKey) {
      if (needChanged(value, oldValue)) {
        console.log('修改属性')
        trigger(TriggerTypes.SER, target, key, value, oldValue)
      } else {
        console.log('属性存在且无需修改')
      }
    } else {
      console.log('新增属性')
      trigger(TriggerTypes.ADD, target, key, value)
    }
    //当数据更新时，通知对应属性的effect更新
    return res
  }
}

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

export const mutableHandelers = {
  get,
  set
}

export const shallowReactiveHandelers = {
  get: shallowGet,
  set: shallowSet
}

const readonlyObj = {
  set(target: object, key: PropertyKey) {
    console.warn(`set on ${key.toString()} falied`)
  }
}

export const readonlyHandelers = Object.assign(
  {
    get: readonlyGet
  },
  readonlyObj
)

export const shallowReadonlyHandelers = Object.assign(
  {
    get: shallowReadonlyGet
  },
  readonlyObj
)
