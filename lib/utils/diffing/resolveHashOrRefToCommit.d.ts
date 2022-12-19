import { Commit, Repository } from 'nodegit';
export declare function resolveHashOrRefToCommit(repo: Repository, compareOidOrRefName: string): Promise<Commit>;
