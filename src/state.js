export const PENDING   = 1 << 0;
export const RESOLVED  = 1 << 1;

export const FULFILLED = 1 << 2;
export const REJECTED  = 1 << 3;

export const SETTLED   = FULFILLED | REJECTED;
