import buble from 'rollup-plugin-buble'
const pkg = require('./package.json')

export default {
  entry: 'src/main.js',
  plugins: [buble()],
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
