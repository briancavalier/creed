'use strict';

export default function(Deferred) {
    return function(f) {
        let h = new Deferred();
        init(f, x => h.resolve(x), e => h.reject(e));
        return h;
    };
}

function init(f, resolve, reject) {
    try {
        f(resolve, reject);
    } catch (e) {
        reject(e);
    }
}
