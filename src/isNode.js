'use strict';

export default function isNode () {
    /*global process*/
    return typeof process !== 'undefined' &&
        Object.prototype.toString.call(process) === '[object process]';
}
