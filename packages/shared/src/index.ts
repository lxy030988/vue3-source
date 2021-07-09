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
