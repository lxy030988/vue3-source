function patchEvent(el: HTMLElement, key: string, prevValue, nextValue) {
  //更新事件
  const eventName = key.slice(2).toLowerCase();
  prevValue && el.removeEventListener(eventName, prevValue);
  nextValue && el.addEventListener(eventName, nextValue);
}

function patchClass(el: HTMLElement, value) {
  if (!value) {
    value = "";
  }
  el.className = value;
}

function patchStyle(el: HTMLElement, prevValue, nextValue) {
  if (!nextValue) {
    el.removeAttribute("style");
  } else {
    Object.entries(nextValue).forEach((v) => {
      el.style[v[0]] = v[1];
    });
    prevValue &&
      Object.keys(prevValue).forEach((k) => {
        if (!nextValue.hasOwnProperty(k)) {
          el.style[k] = null;
        }
      });
  }
}

function patchAttr(el: HTMLElement, key: string, value) {
  if (!value) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

//属性操作
export function patchProp(el: HTMLElement, key: string, prevValue, nextValue) {
  if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, prevValue, nextValue);
    return;
  }
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      patchAttr(el, key, nextValue);
      break;
  }
}
