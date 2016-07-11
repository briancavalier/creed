import { PENDING, FULFILLED, REJECTED, SETTLED, NEVER, HANDLED } from './state'

export function isPending (p) {
	return (p.state() & PENDING) > 0
}

export function isFulfilled (p) {
	return (p.state() & FULFILLED) > 0
}

export function isRejected (p) {
	return (p.state() & REJECTED) > 0
}

export function isSettled (p) {
	return (p.state() & SETTLED) > 0
}

export function isNever (p) {
	return (p.state() & NEVER) > 0
}

export function isHandled (p) {
	return (p.state() & HANDLED) > 0
}

export function getValue (p) {
	const n = p.near()
	if (!isFulfilled(n)) {
		throw new TypeError('getValue called on ' + p)
	}

	return n.value
}

export function getReason (p) {
	const n = p.near()
	if (!isRejected(n)) {
		throw new TypeError('getReason called on ' + p)
	}

	silenceError(n)
	return n.value
}

export function silenceError (p) {
	p._runAction(silencer)
}

const silencer = {
	fulfilled () {},
	rejected: setHandled
}

function setHandled (rejected) {
	rejected._state |= HANDLED
}
