//节点操作
export const nodeOps = {
  //元素
  createElement: (tag: string) => document.createElement(tag),
  remove: (child: HTMLElement) => {
    const parent = child.parentNode
    parent && parent.removeChild(child)
  },
  insert(
    child: HTMLElement | Text,
    parent: HTMLElement,
    anchor: HTMLElement | null = null
  ) {
    parent.insertBefore(child, anchor) //参照物anchor 为空  相当于 appendChild
  },
  querySelector: (selector: string) => document.querySelector(selector),
  setElementText(el: HTMLElement, text: any) {
    el.textContent = text
  },
  //文本
  createText: (text: string) => document.createTextNode(text),
  setText: (node: Text, text: string) => (node.nodeValue = text)
}
