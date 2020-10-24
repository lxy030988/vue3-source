import {
  isSymbol,
  isObject,
  isArray,
  isInt,
  hasOwn,
  needChanged,
} from "./../utils/index";
import { reactive } from "./reactive";

function createGetter() {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver); //target[key]
    //如果是symbol类型 忽略
    if (isSymbol(key)) {
      //数组中有很多symbol的内置方法
      return res;
    }

    //依赖收集
    console.log("数据做了获取操作");

    if (isObject(res)) {
      //取值是对象 再进行代理，懒递归
      return reactive(res);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    //vue2不支持新增 vue3支持  判断新增还是修改

    const oldValue = target[key];
    //判断是否存在老值  数组 对象 两种情况
    const hasKey =
      isArray(target) && isInt(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    const res = Reflect.set(target, key, value, receiver);

    if (hasKey) {
      if (needChanged(value, oldValue)) {
        console.log("修改属性");
      } else {
        console.log("属性存在且无需修改");
      }
    } else {
      console.log("新增属性");
    }
    return res;
  };
}

const get = createGetter(); //为了预置参数
const set = createSetter();
export const mutableHandelers = {
  get,
  set,
};
