import { QueryFile } from 'pg-promise';
import path from 'path';

const joinPath = path.join;

/**
 *
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

    // console.log(filePath, baseDirPath);

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
 *
 * @param path
 * @returns
 */
function buildPath(path: string | string[] | undefined): string {
    if (!path) return '';
    return Array.isArray(path) ? joinPath(...path) : path;
}
