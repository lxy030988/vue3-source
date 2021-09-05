export const isObject = (v: any) => typeof v === 'object' && v !== null
export const isSymbol = (v: any) => typeof v === 'symbol'
export const isArray = Array.isArray
export const isInt = (v: any) => '' + parseInt(v, 10) === v
export const hasOwn = (v: any, k: any) =>
  Object.prototype.hasOwnProperty.call(v, k)
export const needChanged = (v: any, old: any) => v !== old
export const isString = (v: any) => typeof v === 'string'
export const isFunction = (v: any) => typeof v === 'function'
export const extend = Object.assign
export { ShapeFlags } from './shapeFlags'

export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}

export const enum PatchFlags {
  TEXT = 1,
  CLASS = 1 << 1,
  STYLE = 1 << 2,
  PROPS = 1 << 3,
  FULL_PROPS = 1 << 4,
  HYDRATE_EVENTS = 1 << 5,
  STABLE_FRAGMENT = 1 << 6,
  KEYED_FRAGMENT = 1 << 7,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,
  DYNAMIC_SLOTS = 1 << 10,
  DEV_ROOT_FRAGMENT = 1 << 11,
  HOISTED = -1,
  BAIL = -2
}
