import buble from 'rollup-plugin-buble'
import node from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
const pkg = require('./package.json')

export default {
  input: 'src/main.js',
  plugins: [
    buble(),
    node(),
    commonjs({
      include: 'node_modules/**'
    })
  ],
  output: [
    {
      format: 'umd',
      name: 'creed',
      file: pkg['main'],
      sourcemap: true
    },
    {
      format: 'es',
      file: pkg['jsnext:main'],
      sourcemap: true
    }
  ]
}
