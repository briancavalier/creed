export default function delay(ms, handler, deferred) {
    handler.when(new Delay(ms, deferred));
    return deferred;
}

class Delay {
    constructor(time, next) {
        this.time = time;
        this.next = next;
    }

    fulfilled(handler) {
        setTimeout(fulfillDelayed, this.time, handler, this.next);
        return true;
    }

    rejected(handler) {
        this.next.become(handler);
        return false;
    }
}

function fulfillDelayed(handler, next) {
    next.become(handler);
}