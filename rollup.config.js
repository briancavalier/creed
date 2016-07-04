const pkg = require('./package.json')

export default {
  entry: 'build/src/main.js',
  targets: [
    {
      format: 'umd',
      moduleName: 'creed',
      dest: pkg['main']
    },
    {
      format: 'es',
      dest: pkg['jsnext:main']
    }
  ]
}
