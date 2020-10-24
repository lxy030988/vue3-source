export const isObject = (v: any) => typeof v === "object" && v !== null;
export const isSymbol = (v: any) => typeof v === "symbol";
export const isArray = Array.isArray;
export const isInt = (v: any) => "" + parseInt(v, 10) === v;
export const hasOwn = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
export const needChanged = (v: any, old: any) => v !== old;
