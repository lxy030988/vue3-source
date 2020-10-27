import ts from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import path from "path";

export default {
  input: "src/index.ts",
  output: {
    name: "Vue", //window.Vue
    format: "umd",
    file: path.resolve("dist/vue.js"),
    sourcemap: true, //生成映射文件
  },
  plugins: [
    nodeResolve({
      //解析第三方模块
      extensions: [".js", ".ts"],
    }),
    ts({
      //解析ts
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
    }),
    replace({
      //替换环境变量
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),
    serve({
      //启动服务
      open: true,
      openPage: "/public/idnex.html",
      port: 3000,
      contentBase: "",
    }),
  ],
};
