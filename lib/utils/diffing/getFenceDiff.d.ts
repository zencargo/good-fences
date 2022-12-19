import type Config from '../../types/config/Config';
import type DependencyRule from '../../types/config/DependencyRule';
import type ExportRule from '../../types/config/ExportRule';
export declare type FenceDiff = {
    tags: DiffList<string> | null;
    exports: DiffList<ExportRule> | null;
    imports: DiffList<string> | null;
    dependencies: DiffList<DependencyRule> | null;
};
declare type DiffList<T> = {
    /**
     * The list of new entries in the new version of the list.
     *
     * If there is no new version of the list (e.g. the list was
     * deleted in this change), this will be null.
     */
    added: T[] | null;
    /**
     * The list of old entries in the old version of the list.
     *
     * If there was no old version of the list (e.g. the list was
     * introduced in this change), this will be null.
     */
    removed: T[] | null;
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
export declare function diffList<T>(oldList: T[] | null, newList: T[] | null, checkIsSame: (a: T, b: T) => boolean): DiffList<T> | null;
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
export declare function getFenceDiff(oldFence: Config, newFence: Config): FenceDiff | null;
export {};
