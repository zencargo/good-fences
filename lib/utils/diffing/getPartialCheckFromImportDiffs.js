"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartialCheckFromImportDiffs = void 0;
const result_1 = require("../../core/result");
const path = __importStar(require("path"));
function getPartialCheckFromImportDiffs(graphDiff) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let fences = new Set();
    let sourceFiles = new Set();
    let canResolve = true;
    for (let [normalizedSourceFilePath, importDiff] of graphDiff.sourceImportDiffs.entries()) {
        if ((_a = importDiff.addedImports) === null || _a === void 0 ? void 0 : _a.length) {
            // we need to re-check this file, since the new imports
            // might violate a parent fence of the file, or might
            // violate the exports rules of the fences of new modules
            // it is importing.
            sourceFiles.add(normalizedSourceFilePath);
        }
    }
    for (let [normalizedFencePath, fenceDiff] of graphDiff.fenceDiffs.entries()) {
        if ((_c = (_b = fenceDiff.exports) === null || _b === void 0 ? void 0 : _b.removed) === null || _c === void 0 ? void 0 : _c.length) {
            // if we removed an export, we have to re-evaluate all importers
            // which mean we can't resolve from the repo diff
            result_1.reportWarning(`Cannot perform partial evaluation -- removed export(s) ${fenceDiff.exports.removed
                .map(x => {
                const v = Object.assign({}, x);
                if (v.accessibleTo === null) {
                    delete v.accessibleTo;
                }
                return JSON.stringify(v);
            })
                .join(', ')} from fence ${path.relative(process.cwd(), normalizedFencePath)}`);
            canResolve = false;
        }
        const fenceHadExportsSectionAdded = fenceDiff.exports !== null &&
            fenceDiff.exports.removed === null &&
            fenceDiff.exports.added !== null;
        if (fenceHadExportsSectionAdded) {
            // if we added an exports section, we have to re-evaluate
            // all importers, which means we can't resolve from the repo diff
            result_1.reportWarning(`Cannot perform partial evaluation -- added an exports section to fence ${normalizedFencePath}`);
            canResolve = false;
        }
        const fenceHadImportsSectionAdded = fenceDiff.imports !== null &&
            fenceDiff.imports.removed === null &&
            fenceDiff.imports.added !== null;
        const fenceHadImportsRemoved = (_e = (_d = fenceDiff.imports) === null || _d === void 0 ? void 0 : _d.removed) === null || _e === void 0 ? void 0 : _e.length;
        if (fenceHadImportsRemoved || fenceHadImportsSectionAdded) {
            // Forces a check on all fence children
            fences.add(normalizedFencePath);
        }
        const fenceHadDependenciesRemoved = (_g = (_f = fenceDiff.dependencies) === null || _f === void 0 ? void 0 : _f.removed) === null || _g === void 0 ? void 0 : _g.length;
        const fenceHadDependenciesSectionAdded = fenceDiff.dependencies !== null &&
            fenceDiff.dependencies.removed === null &&
            fenceDiff.dependencies.added !== null;
        if (fenceHadDependenciesRemoved || fenceHadDependenciesSectionAdded) {
            // Forces a check on all fence children
            fences.add(normalizedFencePath);
        }
        const fenceHadTagsRemoved = (_j = (_h = fenceDiff.tags) === null || _h === void 0 ? void 0 : _h.removed) === null || _j === void 0 ? void 0 : _j.length;
        if (fenceHadTagsRemoved) {
            // There might exist another fence that references the removed tag in
            // an imports section, which would make imports that depend on that
            // tag invalid.
            result_1.reportWarning(`Cannot perform partial evaluation -- removed tags from fence ${normalizedFencePath}`);
            canResolve = false;
        }
    }
    if (!canResolve) {
        return null;
    }
    return {
        fences: [...fences],
        sourceFiles: [...sourceFiles],
    };
}
exports.getPartialCheckFromImportDiffs = getPartialCheckFromImportDiffs;
