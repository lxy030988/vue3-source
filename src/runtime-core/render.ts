import { effect } from "../reactivity/index";
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
    mountComponent(n2, container);
  }
}

function mountComponent(vnode, container) {
  //根据组件创建一个实例
  const instance = {
    vnode,
    render: null, //setup的返回值
    subTree: null, //render方法的返回值
  };
  // console.log(vnode.tag);
  const Comp = vnode.tag;
  instance.render = Comp.setup(vnode.props, instance);

  //局部更新组件  每个组件一个effect
  effect(() => {
    //如果返回是对象 templete编译成render函数 再挂载到对象上
    //这边可以做vue2兼容 拿到options API 和 setup的返回值 做合并
    instance.subTree = instance.render && instance.render();
    patch(null, instance.subTree, container);
  });
}

function mountElement(vnode, container) {
  const { tag, children, props } = vnode;
  //讲虚拟节点和真实节点做映射关系
  const el = (vnode.el = nodeOps.createElement(tag));
  if (props) {
    Object.entries(props).forEach((v) => {
      nodeOps.hostPatchProps(el, v[0], v[1]);
    });
  }

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
