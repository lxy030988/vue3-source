import { isArray, isObject, isString, ShapeFlags } from '@vue/shared'

//h('div', { style: { color: 'red' } }, 'hello') h方法和createVnode类似
//rootComponent===type 传进来的app
export const createVnode = (type: any, props: any = {}, children = null) => {
  // 根据type来区分是组件还是普通的元素
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  const vnode = {
    //虚拟节点可以表示dom结构  也可以表示组件
    __v_isVnode: true, //是一个vnode节点
    type,
    props,
    children,
    component: null, //组件的实例
    el: null, //虚拟节点要和真实节点做映射关系
    key: props.key,
    shapeFlag //虚拟节点的类型 元素 组件 等
  }

  normalizeChildren(vnode, children)
  return vnode
}

function normalizeChildren(vnode: any, children: unknown) {
  let type = 0
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.shapeFlag |= type
}
