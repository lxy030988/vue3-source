import { currentInstance, setCurrentInstance } from './component'

const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}
const injectHook = (type: LifecycleHooks, hook: Function, target: any) => {
  //在这个函数中保留了实例 闭包
  if (target) {
    const hooks: Function[] = target[type] || (target[type] = []) //instance.bm = []
    const wrap = () => {
      setCurrentInstance(target) //currentInstance = 自己的
      hook.call(target)
      setCurrentInstance(null)
    }
    hooks.push(wrap)
  } else {
    console.warn(
      'Lifecycle injection APIs can only be used during execution of setup()'
    )
  }
}
const createHook =
  (lifecycle: LifecycleHooks) =>
  (hook: Function, target = currentInstance) => {
    //target是用来表示他是哪个实例的钩子
    //给当前实例 增加 对应生命周期 即可
    injectHook(lifecycle, hook, target)
  }

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
export const onServerPrefetch = createHook(LifecycleHooks.SERVER_PREFETCH)
