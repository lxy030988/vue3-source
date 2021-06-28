//compose
const compose1 = (...fns) => {
  return function (...args) {
    let lastFn = fns.pop()
    return fns.reduceRight((pre, cur) => cur(pre), lastFn(...args))
  }
}

const compose2 = (...fns) => {
  return fns.reduce((pre, cur) => {
    return function (...args) {
      return pre(cur(...args))
    }
  })
}