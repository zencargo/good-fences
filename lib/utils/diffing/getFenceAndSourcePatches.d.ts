import { Diff } from 'nodegit';
/**
 * Given a nodegit Diff object, partitions it by path
 * into diffs between fences or script files. Ignores any paths
 * that are neither fences nor script files
 */
export declare function getFenceAndSourcePatches(diffSinceHash: Diff, extensions: string[]): Promise<import("nodegit").ConvenientPatch[][]>;
