"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFenceAndSourcePatches = void 0;
/**
 * Given a nodegit Diff object, partitions it by path
 * into diffs between fences or script files. Ignores any paths
 * that are neither fences nor script files
 */
function getFenceAndSourcePatches(diffSinceHash, extensions) {
    return __awaiter(this, void 0, void 0, function* () {
        const patches = yield diffSinceHash.patches();
        const fencePatches = [];
        const sourcePatches = [];
        for (let patch of patches) {
            const oldFile = patch.oldFile();
            const newFile = patch.newFile();
            if (oldFile.path().endsWith('fence.json') || newFile.path().endsWith('fence.json')) {
                fencePatches.push(patch);
            }
            else if (extensions.some(scriptFileExtension => oldFile.path().endsWith(scriptFileExtension) ||
                newFile.path().endsWith(scriptFileExtension))) {
                sourcePatches.push(patch);
            }
        }
        return [fencePatches, sourcePatches];
    });
}
exports.getFenceAndSourcePatches = getFenceAndSourcePatches;
