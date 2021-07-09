export const patchStyle = (el: HTMLElement, prevValue: any, nextValue: any) => {
  if (!nextValue) {
    el.removeAttribute('style')
  } else {
    //老的里有 新的里没有
    if (prevValue) {
      for (let key in prevValue) {
        if (!nextValue[key]) {
          el.style[key as any] = ''
        }
      }
    }

    //新的里面直接赋值
    for (let key in nextValue) {
      el.style[key as any] = nextValue[key]
    }
  }
}
