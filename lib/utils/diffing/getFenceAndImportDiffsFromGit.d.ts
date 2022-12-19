import NormalizedPath from '../../types/NormalizedPath';
import { FenceDiff } from './getFenceDiff';
export declare type SourceImportDiff = {
    addedImports: string[];
    removedImports: string[];
};
export declare type FenceAndImportDiffs = {
    fenceDiffs: Map<NormalizedPath, FenceDiff>;
    sourceImportDiffs: Map<NormalizedPath, SourceImportDiff>;
};
/**
 * Given a git OID (commit hash) or ref name (refs/heads/master, HEAD~1),
 * finds the difference in script file imports and fence changes
 * between the current git index (e.g. staged set of files),
 * and the specified oid/refname.
 *
 * @param compareOidOrRefName an oid or refname
 * @returns The fence and import diffs
 */
export declare function getFenceAndImportDiffsFromGit(compareOidOrRefName: string): Promise<FenceAndImportDiffs | null>;
