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
};

// createApp().createRender({nodeOps}) //重写渲染器
