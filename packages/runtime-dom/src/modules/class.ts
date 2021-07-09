export const patchClass = (el: HTMLElement, value: string) => {
  if (!value) {
    value = ''
  }
  el.className = value
}
