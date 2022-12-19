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
exports.resolveHashOrRefToCommit = void 0;
const nodegit_1 = require("nodegit");
function resolveHashOrRefToCommit(repo, compareOidOrRefName) {
    return __awaiter(this, void 0, void 0, function* () {
        let oid;
        try {
            oid = nodegit_1.Oid.fromString(compareOidOrRefName);
        }
        catch (_a) {
            oid = yield nodegit_1.Reference.nameToId(repo, compareOidOrRefName);
        }
        return yield nodegit_1.Commit.lookup(repo, oid);
    });
}
exports.resolveHashOrRefToCommit = resolveHashOrRefToCommit;
