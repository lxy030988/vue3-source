import { nodeOps } from "../runtime-dom/index";
import { isArray, isObject, isString } from "../utils/index";

export function render(vnode, container) {
  //vue2 patch
  //1.初次渲染 2.dom-diff
  patch(null, vnode, container);
}

/**
 *
 * @param n1 老的虚拟节点
 * @param n2 新的虚拟节点
 * @param container 容器
 */
function patch(n1, n2, container) {
  //如果是组件 tag可能是一个对象
  if (isString(n2.tag)) {
    //标签
    mountElement(n2, container);
  } else if (isObject(n2.tag)) {
    //组件
  }
}

function mountElement(vnode, container) {
  const { tag, children, props } = vnode;
  //讲虚拟节点和真实节点做映射关系
  const el = (vnode.el = nodeOps.createElement(tag));
  if (isArray(children)) {
    mountChildren(children, el);
  } else {
    nodeOps.hostSetElementText(el, children);
  }
  nodeOps.insert(el, container);
}

function mountChildren(children: Array<any>, el) {
  children.forEach((child) => {
    patch(null, child, el); //递归挂载孩子节点
  });
}
