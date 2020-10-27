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
  hostPatchProps(el: HTMLElement, key: string, value) {
    if (/^on[^a-z]/.test(key)) {
      //事件
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else {
      //样式
      if (key == "style") {
        Object.entries(value).forEach((v) => {
          el.style[v[0]] = v[1];
        });
      } else {
        el.setAttribute(key, value);
      }
    }
  },
};

// createApp().createRender({nodeOps}) //重写渲染器
