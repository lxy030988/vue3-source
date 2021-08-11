import { hasOwn } from '@vue/shared'

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: any) {
    //取值时 要访问 setupstate props  data
    const { setupState, props, data } = instance
    if (key[0] == '$') {
      //不能访问$开头的变量
      return
    }
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    } else if (hasOwn(data, key)) {
      return data[key]
    }
  },
  set({ _: instance }: any, key: any, value: any) {
    const { setupState, props, data } = instance
    if (hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (hasOwn(props, key)) {
      props[key] = value
    } else if (hasOwn(data, key)) {
      data[key] = value
    }
    return true
  }
}
