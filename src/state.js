/*eslint no-multi-spaces: 0*/
export const PENDING   = 1 << 0
export const FULFILLED = 1 << 1
export const REJECTED  = 1 << 2
export const SETTLED   = FULFILLED | REJECTED
export const NEVER     = 1 << 3

export const HANDLED   = 1 << 4
