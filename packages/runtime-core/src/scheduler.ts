let queue: any[] = []
export function queueIob(job: any) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

let isFlushPending = false
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    Promise.resolve().then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false

  //清空时  我们需要根据调用的顺序依次刷新 ，保证先刷新父组件再刷新子组件
  queue.sort((a, b) => a.id - b.id)

  queue.forEach((q) => q())
  queue.length = 0
}
