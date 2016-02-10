import { fulfill } from '../src/main';
import { assertSame } from './lib/test-util';
import test from 'ava';

test('should satisfy associativity', t => {
	const f = x => fulfill(x + 'f');
	const g = x => fulfill(x + 'g');

	var m = fulfill('m');

	return assertSame(t,
		m.chain(x => f(x).chain(g)),
		m.chain(f).chain(g)
	);
});

test('should reject if f returns a non-promise', t => {
	t.plan(1);
	return fulfill(1).chain(x => x)
		.catch(e => t.ok(e instanceof TypeError));
});
