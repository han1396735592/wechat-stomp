const path = require('path'); //1.引入path包
module.exports = {
    entry: './src/index.js', //打包文件入口
    output: {
        path: path.resolve(__dirname, 'dist'),//2.修改output对象的path属性
        filename: 'index.js',
        libraryTarget: "umd",
    },
    mode: 'production'
}
