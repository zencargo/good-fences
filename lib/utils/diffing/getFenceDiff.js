"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFenceDiff = exports.diffList = void 0;
const isSameExport = (exportA, exportB) => {
    return exportA.accessibleTo === exportB.accessibleTo && exportA.modules === exportB.modules;
};
const isSameDependencyRule = (dependencyA, dependencyB) => {
    return (dependencyA.accessibleTo === dependencyB.accessibleTo &&
        dependencyA.dependency === dependencyB.dependency);
};
/**
 * Gets a difference between the entries of the previous and new list.
 *
 * @param oldList - the old list, or null if the old list did not exist
 * @param newList - the new list, or null if the old list did not exist
 * @param checkIsSame - a method for comparing objects (e.g. for equivalent
 *   objects that are not referentially equal)
 * @returns a DiffList
 */
function diffList(oldList, newList, checkIsSame) {
    if (newList && !oldList) {
        return {
            added: [...newList],
            removed: null,
        };
    }
    else if (oldList && !newList) {
        return {
            added: null,
            removed: [...oldList],
        };
    }
    else if (!oldList && !newList) {
        // no diff (null -> null)
        return null;
    }
    else {
        let listDiff = {
            added: [],
            removed: [],
        };
        // both lists had content, diff them
        for (let oldListEntry of oldList) {
            if (!newList.some(checkIsSame.bind(null, oldListEntry))) {
                listDiff.removed.push(oldListEntry);
            }
        }
        for (let newListEntry of newList) {
            if (!oldList.some(checkIsSame.bind(null, newListEntry))) {
                listDiff.added.push(newListEntry);
            }
        }
        return listDiff.added.length || listDiff.removed.length ? listDiff : null;
    }
}
exports.diffList = diffList;
/**
 * Gets the difference between two fences, which can be used to calculate a partial
 * set of fences and source files that need to be re-checked.
 *
 * Each entry of the resuting FenceDiff object will be a DiffList with an added: and removed:
 * section that hold the added and removed list entries. If the list itself was added or
 * removed the new list will be in the corresponding added: or removed: section, and the
 * other entry will be null.
 *
 * @see DiffList
 */
function getFenceDiff(oldFence, newFence) {
    let diff = {
        tags: diffList(oldFence.tags, newFence.tags, (a, b) => a === b),
        exports: diffList(oldFence.exports, newFence.exports, isSameExport),
        imports: diffList(oldFence.imports, newFence.imports, (a, b) => a === b),
        dependencies: diffList(oldFence.dependencies, newFence.dependencies, isSameDependencyRule),
    };
    if (diff.exports === null && diff.imports === null && diff.dependencies === null) {
        return null;
    }
    return diff;
}
exports.getFenceDiff = getFenceDiff;
