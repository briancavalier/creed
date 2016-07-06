const rollup = require('rollup').rollup;
const buble = require('rollup-plugin-buble');
const fs = require('fs');

rollup({
        entry: './src/main.js',
        plugins: [buble({
            transforms: {
                dangerousForOf: true
            }
        })]
    })
    .then(function(bundle) {
        return bundle.write({
            format: 'umd',
            moduleName: 'creed',
            dest: 'bundle.js'
        });
    })
    .then(console.log)
    .catch(console.trace)
