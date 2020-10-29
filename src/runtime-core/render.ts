import { effect } from "../reactivity/index";
import { nodeOps } from "../runtime-dom/index";
import { isArray, isObject, isString } from "../utils/index";

export function render(vnode, container) {
  //vue2 patch
  //1.初次渲染 2.dom-diff
  patch(container._vnode, vnode, container);
  container._vnode = vnode; //上一次渲染的虚拟节点
}

/**
 *
 * @param n1 老的虚拟节点
 * @param n2 新的虚拟节点
 * @param container 容器
 */
function patch(n1, n2, container, anchor?) {
  // console.log("oldvnode", n1);
  //如果是组件 tag可能是一个对象
  if (isString(n2.tag)) {
    //标签
    processElement(n1, n2, container, anchor);
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

function processElement(n1, n2, container, anchor) {
  if (n1) {
    patchElement(n1, n2);
  } else {
    //初次挂载
    mountElement(n2, container, anchor);
  }
}

function patchElement(n1, n2) {
  //看n1 n2是否一样 只考虑有key的情况
  const el = (n2.el = n1.el); //节点一样就复用
  patchProps(el, n1.props, n2.props);
  //比对元素的孩子
  patchChildren(n1, n2, el);
}

function patchChildren(n1, n2, container) {
  const c1 = n1.children;
  const c2 = n2.children;
  if (isString(c2)) {
    if (c1 != c2) {
      //直接用文本替换
      nodeOps.hostSetElementText(container, c2);
    }
  } else {
    //c2 是数组
    if (isString(c1)) {
      //删除c1中原有的内容 再插入新的内容
      nodeOps.hostSetElementText(container, "");
      mountChildren(c2, container);
    } else {
      patchKeyedChildren(c1, c2, container);
    }
  }
}

function patchKeyedChildren(c1: Array<any>, c2: Array<any>, container) {
  //内部diff优化 头头比较 尾尾比较 头尾比较 尾头比较 ... 省略
  //
  const keyedToNewIndexMap = new Map();
  // 1.根据新节点 生成 key:index 映射表
  c2.forEach((child, i) => {
    keyedToNewIndexMap.set(child.props.key, i);
  });
  // console.log("keyedToNewIndexMap", keyedToNewIndexMap);
  // 2.去老的里面找 有一样的就复用
  // 3.新的比老的多 添加   老的比新的多 删除
  const newIndexToOldIndexMap = new Array(c2.length).fill(-1); //新老节点映射表
  c1.forEach((child, i) => {
    const newIndex = keyedToNewIndexMap.get(child.props.key);
    if (newIndex == undefined) {
      //老的有 新的没有 删除老节点
      nodeOps.remove(child.el);
    } else {
      //复用 并且比对属性
      newIndexToOldIndexMap[newIndex] = i + 1;
      patch(child, c2[newIndex], container);
    }
  });
  // 4.两个key一样 比较属性  移动
  //获取不需要移动的最长个数   //最长递增子序列  数组push+二分查找
  const sequence = getSequence(newIndexToOldIndexMap);
  // console.log(newIndexToOldIndexMap, "sequence", sequence);
  let j = sequence.length - 1;
  // 移动 从后往前插入
  for (let i = c2.length - 1; i >= 0; i--) {
    const anchor = i + 1 < c2.length ? c2[i + 1].el : null;
    //有可能新的比老的多
    if (newIndexToOldIndexMap[i] === -1) {
      //这是一个新元素 需要插入列表中  插入到某个元素的前面
      patch(null, c2[i], container, anchor);
    } else {
      //不需要移动的 直接跳过
      // console.log(i, sequence[j], sequence);
      if (i === sequence[j]) {
        j--;
      } else {
        // console.log("移动", i);
        //先将最后一项插入到页面中
        nodeOps.insert(c2[i].el, container, anchor);
      }
    }
  }
}

function patchProps(el, oldProps, newProps: Object) {
  //比较属性
  if (oldProps !== newProps) {
    // 1.讲新的属性 全部设置 以新的为准
    Object.keys(newProps).forEach((key) => {
      const oldProp = oldProps[key];
      const newProp = newProps[key];
      if (newProp !== oldProp) {
        nodeOps.hostPatchProps(el, key, oldProp, newProp);
      }
    });
    // 2.老的里有 新的里没有 需要删掉
    Object.keys(oldProps).forEach((key) => {
      if (!newProps.hasOwnProperty(key)) {
        nodeOps.hostPatchProps(el, key, oldProps[key], null);
      }
    });
  }
}

function mountElement(vnode, container, anchor) {
  const { tag, children, props } = vnode;
  //讲虚拟节点和真实节点做映射关系
  const el = (vnode.el = nodeOps.createElement(tag));
  if (props) {
    Object.entries(props).forEach((v) => {
      nodeOps.hostPatchProps(el, v[0], null, v[1]);
    });
  }

  if (isArray(children)) {
    mountChildren(children, el);
  } else {
    nodeOps.hostSetElementText(el, children);
  }
  nodeOps.insert(el, container, anchor);
}

function mountChildren(children: Array<any>, el) {
  children.forEach((child) => {
    patch(null, child, el); //递归挂载孩子节点
  });
}

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  //最长递增子序列的索引
  const p = arr.slice(); //拷贝一个新数组
  const result = [0]; //存的arr的索引
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j; //将当前最后一项 放到P对应的索引上
        result.push(i);
        continue;
      }
      //二分查找
      u = 0; //头
      v = result.length - 1; //尾
      while (u < v) {
        c = ((u + v) / 2) | 0; // | 0 取整
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      //当前这一项 比arr result中的二分查找结果的那个值小
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i; //这里有可能后面的把前面的换掉了，导致结果有问题
      }
    }
  }

  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result; //标记
}
