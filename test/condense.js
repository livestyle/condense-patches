'use strict';
const assert = require('assert');
const condense = require('../');

describe('LiveStyle patch',  () => {
	it('condense', function() {
		var original = makePatch('padding:10px;color:red', 'margin:1px');
		var cond = function() {
			var args = Array.prototype.slice.call(arguments, 0);
			return condense([original].concat(args));
		};

		var patches = cond(makePatch('position:relative'));
		assert.equal(patches.length, 1);
		assert.deepEqual(patches[0].update, parse('padding:10px;color:red;position:relative'));
		assert.deepEqual(patches[0].remove, parse('margin:1px'));

		patches = cond(makePatch('position:relative;padding:5px'));
		assert.equal(patches.length, 1);
		assert.deepEqual(patches[0].update, parse('color:red;position:relative;padding:5px'));
		assert.deepEqual(patches[0].remove, parse('margin:1px'));

		patches = cond(makePatch('', 'color:red'));
		assert.equal(patches.length, 1);
		assert.deepEqual(patches[0].update, parse('padding:10px'));
		assert.deepEqual(patches[0].remove, parse('margin:1px;color:red'));

		patches = cond(makePatch('font-size:10px'), makePatch('margin:1px'));
		assert.equal(patches.length, 1);
		assert.deepEqual(patches[0].update, parse('padding:10px;color:red;font-size:10px;margin:1px'));
		assert.deepEqual(patches[0].remove, []);
	});

	it('condense properties', function() {
		var condensed = condense([
			makePatch('color:red'),
			makePatch('color:red;m:1;'),
			makePatch('color:red;mar:1;', 'm:1'),
			makePatch('color:red;margin:1;', 'mar:1')
		]);

		assert.equal(condensed.length, 1);
		assert.deepEqual(condensed[0].update, parse('color:red;margin:1;'));
		assert.deepEqual(condensed[0].remove, parse('m:1;mar:1'));
	});
});

function parse(props) {
    if (!props) return [];
    if (typeof props !== 'string') {
        return props;
    }

    return props.split(';').filter(Boolean).map(item => {
        var parts = item.split(':');
        return {
            name: parts[0].trim(),
            value: parts[1].trim()
        };
    });
};

function makePatch(updated, removed, path) {
    if (!path) {
        path = 'div|1';
    }

    if (typeof path === 'string') {
        let parts = path.split('|');
        path = [[parts[0].trim(), parts[1] || 1]];
    }

    return {
        path,
        action: 'update',
        update: parse(updated),
        remove: parse(removed)
    }
};
