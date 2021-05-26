import path from "path";
import json from '@rollup/plugin-json'
import ts from "rollup-plugin-typescript2";
import nodeResolve from "@rollup/plugin-node-resolve";

//根据环境变量中的TARGET属性，找到对应模块的package.json
const name = process.env.TARGET //包名

const packagesDir = path.resolve(__dirname, 'packages')

//基准目录
const packageDir = path.resolve(packagesDir, name)

const resolve = (name) => path.resolve(packageDir, name)

const pkg = require(resolve('package.json'))

//对打包类型做一个映射表 根据pkg.buildOptions.formats来格式化需要打包的内容
const buildOptions = pkg.buildOptions

const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  'cjs': {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  'global': {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'//立即执行函数
  }
}

function createConfig(output) {
  output.name = buildOptions.name
  output.sourcemap = true

  return {
    input: resolve("src/index.ts"),
    output,
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      nodeResolve()
    ],
  }
}

export default buildOptions.formats.map(item => createConfig(outputConfig[item]))

