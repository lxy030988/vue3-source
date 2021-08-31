// const fs = require('fs')
const execa = require('execa') //开启子进程  使用rollup进行打包

const target = 'compiler-dom'

async function build(target) {
  await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'//当子进程打包的信息共享给父进程
  })
}

build(target)