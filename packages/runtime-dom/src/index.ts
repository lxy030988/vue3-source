//提供domAPI方法  节点操作 属性操作
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

//渲染时用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps)

export { rendererOptions }
