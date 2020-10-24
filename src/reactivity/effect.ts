import { isArray, isInt } from "./../utils/index";
//effect => vue2 watcher
export function effect(fn: Function, options: any = {}) {
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect();
  }
  return effect;
}

let activeEffect; //用来存储当前的effect函数
let uid = 0;
const effectStack = []; //解决effect嵌套问题
function createReactiveEffect(fn: Function, options: object = {}) {
  const effect = function () {
    //防止递归执行
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(activeEffect);
        //用户写的逻辑，内部会对数据进行取值操作，在取值时 可以拿到这个activeEffect
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++;
  effect.deps = []; //用来表示 effect 中依赖了哪些属性
  effect.options = options;
  return effect;
}

//将属性和effect做一个关联 {object:{key:[effect,effect]}}
const targetMap = new WeakMap();
export function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
  console.log("targetMap 依赖", targetMap);
}

//触发视图更新操作
export function trigger(type, target, key, value?, oldValue?) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  const run = (effects) => {
    if (effects) {
      effects.forEach((effect) => effect());
    }
  };

  //数组的特殊情况
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key == "length" || key >= value) {
        //如果改的长度 小于数组原有的长度时  应该更新视图
        run(dep);
      }
    });
  } else {
    if (key != void 0) {
      //对象的处理  说明修改了key
      run(depsMap.get(key));
    }
  }

  if (type === "add") {
    //数组 通过索引新增
    if (isArray(target) && isInt(key)) {
      run(depsMap.get("length"));
      //因为页面中直接使用了数组也会对数组进行取值操作，会对length进行收集，新增属性时直接触发length即可
    }
  }
}
