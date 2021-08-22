# vue3

## 1、搭建 rollup 开发环境

- [yarn](https://yarn.bootcss.com/docs/usage/) （只有yarn支持Monorepo）

- 插件

- ```js
  - rollup  打包工具
  - rollup-plugin-typescript2  解析ts插件
  - @rollup/plugin-node-resolve  解析第三方模块
  - @rollup/plugin-replace  替换插件
  - rollup-plugin-serve  启动本地服务插件
  - @rollup/plugin-json 支持引入json
  - execa 开启子进程
  ```




## 2、配置打包环境

- yarn installl 会把packages下面的包软链到node_modules下面





## 编译过程

- https://vue-next-template-explorer.netlify.app/
- 先将模板进行分析，生成对应的ast树（对象来描述语法的）
- 做转换流程  transform  对动态节点做一些标记 ： 指令 插槽 事件 属性 ...   patchFlag
- 代码生成 codegen 生成最终的代码

### Block => Block Tree

- diff算法的特点是递归遍历，每次比较同一层；之前写的都是全量递归
- Block 的作用就是收集动态节点（树下面所有的），将树的递归拍平成一个数组
- 在createVNode的时候，会判断这个节点是动态的，就让外层的Block 收集起来
- 目的是  diff的时候只diff动态的节点
- 如果会影响结构的都会被标记成Block 节点  v-if  v-else  v-for
- 父亲也会收集儿子Block => Block Tree(多个节点组成的)
- 改变结构的也要封装到Block中，我们期望的更新方式是拿以前的和现在的去比，靶向更新；如果前后节点个数不一致，那只能全量更新

### patchFlag

- 对不同的动态节点进行描述的
- 表示要比对哪些类型

### 性能优化
- 每次重新渲染 都要创建虚拟节点 createVnode 
- 静态提升 静态节点进行提取

### 事件缓存
- 缓存事件 防止重新创建事件

### vue3和vue2对比
- 响应式原理 proxy defineProperty
- vue3 diff算法(可以根据patchflag做diff) 和 vue2的区别 (全量diff) 最长递增子序列
- options Api / composition Api => treeshaking
- Fragment 多个根节点、 Teleport、Suspense、Keep-alive Transition
- vue3 ts / vue2 flow
- 自定义渲染器 createRenderer() 传入自己的渲染方法 好处 可以根据vue核心来实现不同平台的代码
- monorepo的代码管理方法
- 模板编译优化