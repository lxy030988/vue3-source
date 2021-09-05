import { generate } from './codegen'
import { baseParse } from './parse'
import { getBaseTransformPreset, transform } from './transform'

export function baseCompile(template: string) {
  // 将模板转成ast树
  const ast = baseParse(template)
  //将ast语法进行转化(优化 静态提升 方法缓存  生成代码 为了最终生成代码使用)
  const nodeTransforms = getBaseTransformPreset()
  transform(ast, { nodeTransforms })

  return generate(ast) //在生成的过程中 需要创建一个字符串拼接后的结果
}

//最后的结果 new function
