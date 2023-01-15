import { QueryFile } from 'pg-promise';
import path from 'path';

const joinPath = path.join;

/**
 * Creates new SQL QueryFile from path provided
 * @param path
 * @param directory
 * @returns
 */
export const sqlFile = (
    path: string | string[],
    directory?: string | string[]
): QueryFile => {
    const filePath = buildPath(path);
    const baseDirPath = buildPath(directory || process.cwd());

    const qf = new QueryFile(joinPath(baseDirPath, filePath), {
        minify: true,
        debug: true // todo env conditon
    });

    if (qf.error) {
        // todo
        console.error(qf.error);
    }

    return qf;
};

/**
 * Joins together paths
 * @param path
 * Location parts where file is stored
 * @returns
 * Complete joined path
 */
function buildPath(path: string | string[] | undefined): string {
    if (!path) return '';
    return Array.isArray(path) ? joinPath(...path) : path;
}
