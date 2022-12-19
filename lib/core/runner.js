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
exports.run = void 0;
const getOptions_1 = __importStar(require("../utils/getOptions"));
const validateFile_1 = __importDefault(require("../validation/validateFile"));
const TypeScriptProgram_1 = __importDefault(require("./TypeScriptProgram"));
const normalizePath_1 = __importDefault(require("../utils/normalizePath"));
const result_1 = require("./result");
const validateTagsExist_1 = require("../validation/validateTagsExist");
const FdirSourceFileProvider_1 = require("./FdirSourceFileProvider");
const runWithConcurrentLimit_1 = require("../utils/runWithConcurrentLimit");
const getConfigManager_1 = __importDefault(require("../utils/getConfigManager"));
const path = __importStar(require("path"));
function getPartialCheck() {
    return __awaiter(this, void 0, void 0, function* () {
        let options = getOptions_1.default();
        if (options.sinceGitHash) {
            result_1.reportWarning(`Partial check is not implemented, running good fences in default mode.`);
            return Promise.resolve({ fences: [], sourceFiles: [] });
        }
    });
}
function getSourceFilesNormalized(sourceFileProvider, rootDirs) {
    return __awaiter(this, void 0, void 0, function* () {
        let files = yield sourceFileProvider.getSourceFiles(rootDirs);
        const normalizedFiles = files.map(file => normalizePath_1.default(file));
        return normalizedFiles;
    });
}
function getSourceFilesFromPartialCheck(sourceFileProvider, partialCheck) {
    return __awaiter(this, void 0, void 0, function* () {
        const fenceScopeFiles = yield getSourceFilesNormalized(sourceFileProvider, partialCheck.fences.map((fencePath) => path.dirname(fencePath)));
        return Array.from(new Set([...partialCheck.sourceFiles, ...fenceScopeFiles]));
    });
}
function run(rawOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        // Store options so they can be globally available
        getOptions_1.setOptions(rawOptions);
        let options = getOptions_1.default();
        let partialCheck = yield getPartialCheck();
        if (options.partialCheckLimit) {
            if (!partialCheck) {
                result_1.reportWarning(`Skipping fence validation. Could not calculate a partial check, but partialCheckLimit was specified in options`);
                return result_1.getResult();
            }
            if (partialCheck.fences.length + partialCheck.sourceFiles.length >
                options.partialCheckLimit) {
                result_1.reportWarning(`Skipping fence validation. The partial check had more than ${options.partialCheckLimit} changes`);
                return result_1.getResult();
            }
        }
        let sourceFileProvider = options.looseRootFileDiscovery
            ? new FdirSourceFileProvider_1.FDirSourceFileProvider(options.project, options.rootDir)
            : new TypeScriptProgram_1.default(options.project);
        if (!partialCheck) {
            // Validating tags exist requires a full load of all fences
            // we can't do this in partial check mode.
            //
            // Prefetching the full config set here avoids the overhead
            // of partial fence loading, since we know we are loading
            // the full fence set.
            getConfigManager_1.default().getAllConfigs();
            validateTagsExist_1.validateTagsExist();
        }
        let normalizedFiles = yield (partialCheck
            ? getSourceFilesFromPartialCheck(sourceFileProvider, partialCheck)
            : getSourceFilesNormalized(sourceFileProvider));
        yield runWithConcurrentLimit_1.runWithConcurrentLimit(
        // we have to limit the concurrent executed promises because
        // otherwise we will open all the files at the same time and
        // hit the MFILE error (when we hit rlimit)
        options.maxConcurrentFenceJobs, normalizedFiles, (normalizedFile) => validateFile_1.default(normalizedFile, sourceFileProvider), options.progress);
        const result = result_1.getResult();
        // Reset the global results object so so that future runs
        // do not have the results from this run.
        result_1.resetResult();
        return result;
    });
}
exports.run = run;
