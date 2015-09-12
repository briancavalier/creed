import { Future } from '../src/Promise';
import { isNever } from '../src/inspect';
import assert from 'assert';

describe('empty', function() {

    it('should return never', () => {
        assert(isNever(Future.empty()));
    });

});