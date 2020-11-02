//节点操作
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
  setElementText(el: HTMLElement, text) {
    el.textContent = text;
  },
};
