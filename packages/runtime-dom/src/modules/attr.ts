export const patchAttr = (el: HTMLElement, key: string, value: string) => {
  if (!value) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
