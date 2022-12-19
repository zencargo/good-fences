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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFenceAndImportDiffsFromGit = void 0;
const nodegit_1 = require("nodegit");
const loadConfig_1 = require("../loadConfig");
const normalizePath_1 = __importDefault(require("../normalizePath"));
const result_1 = require("../../core/result");
const getScriptFileExtensions_1 = require("../getScriptFileExtensions");
const getFenceDiff_1 = require("./getFenceDiff");
const getTsImportSetFromSourceString_1 = require("../getTsImportSetFromSourceString");
const resolveHashOrRefToCommit_1 = require("./resolveHashOrRefToCommit");
const getFenceAndSourcePatches_1 = require("./getFenceAndSourcePatches");
/**
 * Creates an empty fence given a path.
 *
 * Used when diffing fences against a fence that did not or no longer exists.
 */
function emptyFence(path) {
    return {
        tags: [],
        imports: null,
        exports: null,
        dependencies: null,
        path: path,
    };
}
/**
 * Given a git OID (commit hash) or ref name (refs/heads/master, HEAD~1),
 * finds the difference in script file imports and fence changes
 * between the current git index (e.g. staged set of files),
 * and the specified oid/refname.
 *
 * @param compareOidOrRefName an oid or refname
 * @returns The fence and import diffs
 */
function getFenceAndImportDiffsFromGit(compareOidOrRefName) {
    return __awaiter(this, void 0, void 0, function* () {
        const repo = yield nodegit_1.Repository.open(process.cwd());
        const [index, headCommitTree, compareTree] = yield Promise.all([
            repo.index(),
            repo.getHeadCommit().then(headCommit => { var _a; return (_a = headCommit === null || headCommit === void 0 ? void 0 : headCommit.getTree) === null || _a === void 0 ? void 0 : _a.call(headCommit); }),
            resolveHashOrRefToCommit_1.resolveHashOrRefToCommit(repo, compareOidOrRefName).then(commit => commit.getTree()),
        ]);
        let repoDiff;
        const indexToHead = yield nodegit_1.Diff.treeToIndex(repo, headCommitTree, null);
        const indexIsEmpty = indexToHead.numDeltas() === 0;
        // Permit all extensions in the extension set. If we are
        // overly-permissive here, the script files we detect for
        // checking should be filtered out while providing source
        // files.
        const mostPermissiveExtensionSet = getScriptFileExtensions_1.getScriptFileExtensions({
            includeJson: true,
            jsx: true,
            allowJs: true,
            // This is used as a glob of for *${dotExt}, so .d.ts files
            // will be included in by the *.ts glob. Likewise for .d.tsx
            includeDefinitions: false,
        });
        if (!indexIsEmpty) {
            repoDiff = yield nodegit_1.Diff.treeToIndex(repo, compareTree, index, {
                contextLines: 0,
                pathspec: mostPermissiveExtensionSet.map(dotExt => '*' + dotExt),
            });
        }
        else {
            repoDiff = yield nodegit_1.Diff.treeToTree(repo, compareTree, headCommitTree, {
                contextLines: 0,
                pathspec: mostPermissiveExtensionSet.map(dotExt => '*' + dotExt),
            });
        }
        const [fencePatches, sourcePatches] = yield getFenceAndSourcePatches_1.getFenceAndSourcePatches(repoDiff, mostPermissiveExtensionSet);
        // TODO: track files across moves (Should just be a fence removal and addition)
        for (let patch of [...fencePatches, ...sourcePatches]) {
            // nodegit represents a file being created or deleted by
            // setting the object hash of the old / new file as 0,
            // and reports the oldFile and newFile's path as the same,
            // so the below only triggers on moved files.
            if (patch.oldFile().path() && patch.oldFile().path() !== patch.newFile().path()) {
                result_1.reportWarning('Detected a moved fence or source file. Aborting partial check from git');
                return null;
            }
        }
        const fenceAndImportDiffs = {
            fenceDiffs: new Map(),
            sourceImportDiffs: new Map(),
        };
        const loadFencePatchesPromise = Promise.all(fencePatches.map((fencePatch) => __awaiter(this, void 0, void 0, function* () {
            // an oid of zero means the object is not present in the
            // git db (e.g. it was deleted or did not yet exist)
            const newPath = !fencePatch.newFile().id().iszero()
                ? fencePatch.newFile().path()
                : null;
            const oldPath = !fencePatch.oldFile().id().iszero()
                ? fencePatch.oldFile().path()
                : null;
            const newFenceContentPromise = newPath
                ? (() => __awaiter(this, void 0, void 0, function* () {
                    const indexEntry = yield index.getByPath(newPath);
                    const newFenceBlob = yield repo.getBlob(indexEntry.id);
                    return loadConfig_1.loadConfigFromString(normalizePath_1.default(newPath), newFenceBlob.content().toString('utf-8'));
                }))()
                : emptyFence(normalizePath_1.default(oldPath));
            const oldFenceContentPromise = oldPath
                ? (() => __awaiter(this, void 0, void 0, function* () {
                    const oldFenceEntry = yield compareTree.getEntry(oldPath);
                    const oldFenceBlob = yield oldFenceEntry.getBlob();
                    return loadConfig_1.loadConfigFromString(normalizePath_1.default(oldPath), oldFenceBlob.content().toString('utf-8'));
                }))()
                : emptyFence(normalizePath_1.default(newPath));
            const [newFence, oldFence] = yield Promise.all([
                newFenceContentPromise,
                oldFenceContentPromise,
            ]);
            const fenceDiff = getFenceDiff_1.getFenceDiff(oldFence, newFence);
            if (fenceDiff) {
                fenceAndImportDiffs.fenceDiffs.set(normalizePath_1.default(fencePatch.newFile().path()), fenceDiff);
            }
        })));
        const loadSourcePatchesPromise = Promise.all(sourcePatches.map((sourcePatch) => __awaiter(this, void 0, void 0, function* () {
            // an oid of zero means the object is not present in the
            // git db (e.g. it was deleted or did not yet exist)
            const newPath = !sourcePatch.newFile().id().iszero()
                ? sourcePatch.newFile().path()
                : null;
            const oldPath = !sourcePatch.oldFile().id().iszero()
                ? sourcePatch.oldFile().path()
                : null;
            if (!newPath) {
                // only check files that actually exist now
                return;
            }
            const newSourceImportsPromise = (() => __awaiter(this, void 0, void 0, function* () {
                const indexEntry = yield index.getByPath(newPath);
                const newSourceBlob = yield repo.getBlob(indexEntry.id);
                return getTsImportSetFromSourceString_1.getTsImportSetFromSourceString(newSourceBlob.content().toString('utf-8'));
            }))();
            const oldSourceImportsPromise = oldPath
                ? (() => __awaiter(this, void 0, void 0, function* () {
                    const oldSourceEntry = yield compareTree.getEntry(oldPath);
                    const oldSourceBlob = yield oldSourceEntry.getBlob();
                    return getTsImportSetFromSourceString_1.getTsImportSetFromSourceString(oldSourceBlob.content().toString('utf-8'));
                }))()
                : new Set();
            const [newSourceImports, oldSourceImports] = yield Promise.all([
                newSourceImportsPromise,
                oldSourceImportsPromise,
            ]);
            const sourceImportDiff = {
                removedImports: [...oldSourceImports].filter(x => !newSourceImports.has(x)),
                addedImports: [...newSourceImports].filter(x => !oldSourceImports.has(x)),
            };
            if (sourceImportDiff.removedImports.length > 0 ||
                sourceImportDiff.addedImports.length > 0) {
                fenceAndImportDiffs.sourceImportDiffs.set(normalizePath_1.default(sourcePatch.newFile().path()), sourceImportDiff);
            }
        })));
        yield Promise.all([loadFencePatchesPromise, loadSourcePatchesPromise]);
        return fenceAndImportDiffs;
    });
}
exports.getFenceAndImportDiffsFromGit = getFenceAndImportDiffsFromGit;
