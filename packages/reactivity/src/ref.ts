import { isObject, needChanged } from '@vue/shared'
import { track, trigger } from './effect'
import { TrackTypes, TriggerTypes } from './operators'
import { reactive } from './reactive'

export function ref(v: any) {
  return createRef(v)
}

export function shallowRef(v: any) {
  return createRef(v, true)
}

//ref和reactive的区别  reactive内部用的proxy  ref内部用的defineProperty

const convert = (v: any) => (isObject(v) ? reactive(v) : v)
class RefImpl {
  public _value: any
  public _v_isRef = true
  constructor(public rawValue: any, public shallow: boolean) {
    this._value = shallow ? rawValue : convert(rawValue)
  }
  get value() {
    track(this, TrackTypes.GET, 'value')
    return this._value
  }
  set value(newValue) {
    if (needChanged(newValue, this.rawValue)) {
      this.rawValue = newValue //新值作为老值
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(TriggerTypes.SER, this, 'value', newValue)
    }
  }
}

function createRef(v: any, shallow = false) {
  return new RefImpl(v, shallow)
}
