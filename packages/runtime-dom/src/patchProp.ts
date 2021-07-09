import { patchAttr } from './modules/attr'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/event'
import { patchStyle } from './modules/style'

//属性操作
export const patchProp = (
  el: HTMLElement,
  key: string,
  prevValue: any,
  nextValue: any
) => {
  switch (key) {
    case 'class':
      patchClass(el, nextValue)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    default:
      if (/^on[^a-z]/.test(key)) {
        patchEvent(el, key, prevValue, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
