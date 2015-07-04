export default function delay(Deferred, ms, handler) {
    if(ms <= 0) {
        return handler;
    }

    let ref = new Deferred();
    handler.when(new Delay(ms, ref));
    return ref;
}

class Delay {
    constructor(time, ref) {
        this.time = time;
        this.ref = ref;
    }

    fulfilled(handler) {
        setTimeout(fulfillDelayed, this.time, handler, this.ref);
    }

    rejected(handler) {
        this.ref.become(handler);
        return false;
    }
}

function fulfillDelayed(handler, next) {
    next.become(handler);
}