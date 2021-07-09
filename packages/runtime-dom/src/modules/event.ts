function createInvoker(value: any) {
  const invoker = (e: Event) => {
    invoker.value(e)
  }
  invoker.value = value //为了能随时更改value属性
  return invoker
}

//1.给元素缓存一个绑定事件的列表
//2.如果没有缓存过 nextValue有值，需要绑定方法 并且缓存起来
//3.以前绑定过的需要删除掉，删除缓存
//4.前后都有，直接改变existingInvoker中value值
export const patchEvent = (
  el: HTMLElement & { _vei?: Record<string, any> },
  key: string,
  prevValue: any,
  nextValue: any
) => {
  //对函数的缓存
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[key]
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    const eventName = key.slice(2).toLowerCase()
    if (nextValue) {
      //要绑定事件  以前没有绑定过
      const invoker = (invokers[key] = createInvoker(nextValue))
      el.addEventListener(eventName, invoker)
    } else if (existingInvoker) {
      el.removeEventListener(eventName, existingInvoker)
      invokers[key] = undefined
    }
  }
}
