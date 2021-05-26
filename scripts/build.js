const fs = require('fs')
const execa = require('execa') //开启子进程  使用rollup进行打包

const targets = fs.readdirSync('packages').filter(item => fs.statSync(`packages/${item}`).isDirectory())
console.log('targets', targets)

//对packages下的包进行依次打包 并行打包

async function build(target) {
  await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'//当子进程打包的信息共享给父进程
  })
}

function runParallel(targets, interatorFn) {
  const res = []
  for (const item of targets) {
    const p = interatorFn(item)
    res.push(p)
  }

  return Promise.all(res)
}

runParallel(targets, build)