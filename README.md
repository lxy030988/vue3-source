# vue3 - 手写 vue3 响应式

## 1、搭建 rollup 开发环境

rollup  打包工具
rollup-plugin-typescript2  解析ts插件
@rollup/plugin-node-resolve  解析第三方模块
@rollup/plugin-replace  替换插件
rollup-plugin-serve  启动本地服务插件



## 2、配置打包环境



```shell
npx ts --init
```



```json
"dev": "rollup -c -w" //-c 指定配置文件 -w 实时监控刷新
```

