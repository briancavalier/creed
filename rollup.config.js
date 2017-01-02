import buble from 'rollup-plugin-buble'
import node from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
const pkg = require('./package.json')

export default {
  entry: 'src/main.js',
  plugins: [
    buble(),
    node(),
    commonjs({
      include: 'node_modules/**'
    })
  ],
  targets: [
    {
      format: 'umd',
      moduleName: 'creed',
      dest: pkg['main'],
      sourceMap: true
    },
    {
      format: 'es',
      dest: pkg['jsnext:main'],
      sourceMap: true
    }
  ]
}
