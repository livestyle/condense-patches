'use strict';

/**
 * Condenses list of patches: merges multiple patches for the same
 * selector into a single one and tries to reduce operations.
 * The order of patches is very important since it affects the list
 * of updates applied to source code
 * @param {Array} patches List of patches
 * @return {Array}
 */
module.exports = function(patches) {
	var lookup = pathLookup(patches);

	return Object.keys(lookup).map(path => {
		var patchList = lookup[path];
		var topPatch = copy(patchList.shift());
		patchList.forEach(function(patch) {
			if (patch.action === 'remove' || topPatch.action === 'remove') {
				// supress all previous updates
				return topPatch = copy(patch);
			}

			topPatch.action = 'update';
			topPatch.remove = topPatch.remove.filter(item => !find(patch.update, item.name));
            topPatch.update = topPatch.update
            .filter(item => !find(patch.update, item.name))
            .concat(patch.update);

            topPatch.remove = topPatch.remove.concat(patch.remove.filter(item => !find(topPatch.remove, item.name)));

			// do not add/update properties that were removed in next patch
			topPatch.update = topPatch.update.filter(item => !find(patch.remove, item.name));
			topPatch.all = patch.all;
		});
		return topPatch;
	});
};

function find(collection, propName) {
    for (var i = 0, il = collection.length; i < il; i++) {
        if (collection[i].name === propName) {
            return collection[i];
        }
    }
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates path lookup from patch list.
 * @param  {Array} list List of patches
 * @return {Object}     The key is path string, the value is
 * an array of patches with this path
 */
function pathLookup(list) {
    return list.filter(Boolean).reduce((out, patch) => {
        var path = stringifyPath(patch.path);
		if (!(path in out)) {
			out[path] = [];
		}

		out[path].push(patch);
        return out;
    }, {});
}

function stringifyPath(path) {
    return path.map(c => c.join('|')).join('/');
}
