import { isFunction } from '@vue/shared'
import { effect, track, trigger } from './effect'
import { TrackTypes, TriggerTypes } from './operators'

interface getterOptions {
  get(): any
  set(): void
  [key: string]: any
}

class ComputedRefImpl {
  public _dirty = true //默认取值时不要用缓存
  public _value: any
  public effect: any
  constructor(public getter: any, public setter: Function) {
    this.effect = effect(
      getter, //计算属性默认会产生一个effect
      {
        lazy: true, //默认不执行
        scheduler: () => {
          if (!this._dirty) {
            this._dirty = true
            trigger(TriggerTypes.SER, this, 'value')
          }
        }
      }
    )
  }

  get value() {
    //计算属性也要收集依赖

    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false
    }
    track(this, TrackTypes.GET, 'value')
    return this._value
  }

  set value(v) {
    // this._value = v
    this.setter(v)
  }
}

export function computed(getterOrOptions: Function | getterOptions) {
  let getter, setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed must be readonly')
    }
  } else {
    getter = (getterOrOptions as getterOptions).get
    setter = (getterOrOptions as getterOptions).set
  }

  return new ComputedRefImpl(getter, setter)
}
// export function computed1(fn: Function) {
//   // 特殊的effect
//   const runner = effect(fn, { computed: true, lazy: true })
//   return {
//     effect: runner,
//     get value() {
//       return runner()
//     }
//   }
// }
