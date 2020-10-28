//运行时的包 里面放着对dom的操作方法
export const nodeOps = {
  insert(child, parent: HTMLElement, anchor?) {
    if (anchor) {
      parent.insertBefore(child, anchor);
    } else {
      parent.appendChild(child);
    }
  },
  remove(child: HTMLElement) {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
  },
  createElement(tag) {
    return document.createElement(tag);
  },
  hostSetElementText(el: HTMLElement, text) {
    el.textContent = text;
  },
  //属性操作
  hostPatchProps(el: HTMLElement, key: string, oldProp, newProp) {
    if (/^on[^a-z]/.test(key)) {
      //更新事件
      const eventName = key.slice(2).toLowerCase();
      oldProp && el.removeEventListener(eventName, oldProp);
      newProp && el.addEventListener(eventName, newProp);
    } else {
      if (newProp) {
        //样式
        if (key == "style") {
          Object.entries(newProp).forEach((v) => {
            el.style[v[0]] = v[1];
          });
          oldProp &&
            Object.keys(oldProp).forEach((k) => {
              if (!newProp.hasOwnProperty(k)) {
                el.style[k] = null;
              }
            });
        } else {
          el.setAttribute(key, newProp);
        }
      } else {
        //删除属性
        el.removeAttribute(key);
      }
    }
  },
};

// createApp().createRender({nodeOps}) //重写渲染器
