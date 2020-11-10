import { effect } from "../reactivity/index";
import { ShapeFlags } from "../shared/index";
import { createAppAPI } from "./apiCreateApp"; //用户调用的createApp方法
import { createComponentInstance, setupComponent } from "./component";

export function createRender(options) {
  //options是平台传过来的方法，不同的平台可以实现不同的操作逻辑
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
  } = options;

  const render = (vnode, container) => {
    //将虚拟节点变成真实节点 挂载到容器上
    patch(null, vnode, container);
  };

  const isSameVnodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };

  const patch = (n1, n2, container, anchor?) => {
    const { shapeFlag } = n2;

    if (n1 && !isSameVnodeType(n1, n2)) {
      hostRemove(n1.el);
      n1 = null;
    }

    if (shapeFlag & ShapeFlags.ELEMENT) {
      //元素
      processElement(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      //组件
      processComponent(n1, n2, container);
    }
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1) {
      patchElement(n1, n2);
    } else {
      //初次挂载
      mountElement(n2, container, anchor);
    }
  };

  const mountElement = (vnode, container, anchor) => {
    // console.log(vnode, container);
    const { shapeFlag, children, props } = vnode;
    //将虚拟节点和真实节点做映射关系
    const el = (vnode.el = hostCreateElement(vnode.type));
    //创建儿子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    if (props) {
      Object.entries(props).forEach((v) => {
        hostPatchProp(el, v[0], null, v[1]);
      });
    }
    hostInsert(el, container, anchor);
  };

  const mountChildren = (children: Array<any>, el) => {
    children.forEach((child) => {
      patch(null, child, el); //递归挂载孩子节点
    });
  };

  const patchElement = (n1, n2) => {
    // console.log("patchElement", n1, n2);
    //n1 n2 type 一样就复用
    const el = (n2.el = n1.el);
    patchProps(el, n1.props, n2.props);
    //比对元素的孩子
    patchChildren(n1, n2, el);
  };

  const patchProps = (el, oldProps, newProps: Object) => {
    //比较属性
    if (oldProps !== newProps) {
      // 1.将新的属性 全部设置 以新的为准
      Object.keys(newProps).forEach((key) => {
        const oldProp = oldProps[key];
        const newProp = newProps[key];
        if (newProp !== oldProp) {
          hostPatchProp(el, key, oldProp, newProp);
        }
      });
      // 2.老的里有 新的里没有 需要删掉
      Object.keys(oldProps).forEach((key) => {
        if (!newProps.hasOwnProperty(key)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      });
    }
  };

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //新的是文本
      if (c1 != c2) {
        //直接用新的文本替换
        hostSetElementText(el, c2);
      }
    } else {
      //新的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //都是数组 核心diff
        // console.log("核心diff");
        patchKeyedChildren(c1, c2, el);
      } else {
        //新的是数组 老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          //移除老的文本
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //把新元素挂载上去
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchKeyedChildren = (c1: Array<any>, c2: Array<any>, container) => {
    //diff优化
    let i = 0;
    let e1 = c1.length - 1; // 老节点的最后一项index
    let e2 = c2.length - 1; // 新节点的最后一项index

    // (a b) c
    // (a b) d e
    //从头开始比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      i++;
    }

    // a (b c)
    // d e (b c)
    //从尾开始比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //只考虑元素 新增和删除的情况
    // abc=> abcd (i=3,e1=2,e2=3)   abc=> dabc (i=0,e1=-1,e2=0)
    if (i > e1) {
      //新增元素
      if (i <= e2) {
        //表示新增的部分
        //根据e2取他的下一个元素 和 c2的长度比较
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        //从前面添加元素 | 从后面添加元素
        while (i <= e2) {
          patch(null, c2[i], container, anchor);
          i++;
        }
      }
    }
    // (a b) c=>(a b)   i = 2, e1 = 2, e2 = 1
    // a (b c)=>(b c)   i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      //删除元素
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      //无规律的 真正的diff
      // [i ... e1 + 1]: a b [c d e] f g
      // [i ... e2 + 1]: a b [e d c h] f g
      // i = 2, e1 = 4, e2 = 5
      const s1 = i;
      const s2 = i;
      const keyedToNewIndexMap = new Map();
      // 根据新节点 生成 key:index 映射表
      for (i = s2; i <= e2; i++) {
        //循环新节点
        const nextChild = c2[i];
        keyedToNewIndexMap.set(nextChild.key, i);
      }
      // console.log("keyedToNewIndexMap", keyedToNewIndexMap);
      const toBePatched = e2 - s2 + 1; //新节点diff部分的长度
      //去老的里面找 有一样的就复用
      //新的比老的多 添加   老的比新的多 删除
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0); //新老节点映射表
      for (i = s1; i <= e1; i++) {
        //循环老节点
        const prevChild = c1[i];
        const newIndex = keyedToNewIndexMap.get(prevChild.key);
        if (newIndex == undefined) {
          //老的有 新的没有 删除老节点
          hostRemove(prevChild.el);
        } else {
          //复用 并且比对属性
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container);
        }
      }
      console.log("newIndexToOldIndexMap", newIndexToOldIndexMap);

      // // 4.两个key一样 比较属性  移动
      // //获取不需要移动的最长个数   //最长递增子序列  数组push+二分查找
      // const sequence = getSequence(newIndexToOldIndexMap);
      // let j = sequence.length - 1;
      // 移动 倒叙插入
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i; //[e d c h]找到h的索引
        const nextChild = c2[nextIndex]; //找到h
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null; //[e d c h] f g 找到h的下一个元素
        if (newIndexToOldIndexMap[i] === 0) {
          //这是一个新元素 需要插入列表中  插入到某个元素的前面
          patch(null, nextChild, container, anchor);
        } else {
          //不需要移动的 直接跳过
          // console.log(i, sequence[j], sequence);
          // if (i === sequence[j]) {
          //   j--;
          // } else {
          //   // console.log("移动", i);
          //   //根据参照物 移动节点
          hostInsert(nextChild.el, container, anchor);
          // }
        }
      }
    }
  };

  const processComponent = (n1, n2, container) => {
    if (n1) {
      updateComponent(n1, n2, container);
    } else {
      //初次挂载
      mountComponent(n2, container);
    }
  };

  const mountComponent = (initialVnode, container) => {
    //组件挂载逻辑 1.创建组件实例  2.找到组件是render方法  3.执行render
    //组件实例要记录当前的组件状态
    const instance = (initialVnode.component = createComponentInstance(
      initialVnode
    ));
    setupComponent(instance); //找到组件的setup方法
    //调用render方法 如果render方法中数据变了 会重新渲染
    setupRenderEffect(instance, initialVnode, container); //给组件创建一个effect 用户渲染  == vue2 中的watcher
  };

  const setupRenderEffect = (instance, initialVnode, container) => {
    effect(function componentEffect() {
      if (!instance.isMounted) {
        //渲染组件中的内容
        instance.subTree = instance.render && instance.render(); //组件对应渲染的结果
        patch(null, instance.subTree, container);
        instance.isMounted = true;
      } else {
        //更新逻辑
        const prev = instance.subTree;
        const next = instance.render && instance.render();
        // console.log(prev, next);
        patch(prev, next, container);
      }
    });
  };

  const updateComponent = (n1, n2, container) => {};

  return {
    createApp: createAppAPI(render),
  };
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
