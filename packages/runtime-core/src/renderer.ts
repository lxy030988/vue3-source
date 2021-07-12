//创建一个渲染器

import { createAppAPI } from './apiCreateApp'

export function createRenderer(rendererOptions: any) {
  //告诉core怎么渲染

  const render = (vnode: any, container: any) => {
    //core的核心
  }
  return {
    createApp: createAppAPI(render)
  }
}
