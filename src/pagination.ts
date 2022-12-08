import { pgFormat } from './utils';

/**
 * Translates page and pageSize into Postgres LIMIT and OFFSET statements
 * @param params which page to show and how many records
 * @returns Query that can be integrated in run statement with LIMIT and OFFSET
 */
const pagination = ({ page = 0, pageSize = 25 }): string => {
    const offset = page > 0 ? (page - 1) * pageSize : 0;
    return pgFormat(' LIMIT $<pageSize> OFFSET $<offset>', {
        offset,
        pageSize
    });
};

export default pagination;
