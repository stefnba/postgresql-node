"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const defaultPageSize = 25;
/**
 * Translates pagination params into Postgres LIMIT statements
 * @param pagination which page and how many records to show
 * @returns Query that can be integrated in run statement with LIMIT and OFFSET
 */
const pageSize = (pagination) => {
    if (!pagination)
        return '';
    const { pageSize = defaultPageSize } = pagination;
    return (0, utils_1.pgFormat)('LIMIT $<pageSize>', { pageSize });
};
/**
 * Translates pagination params into Postgres OFFSET statements
 * @param pagination which page and how many records to show
 * @returns Query that can be integrated in run statement with LIMIT and OFFSET
 */
const page = (pagination) => {
    if (!pagination)
        return '';
    const { page, pageSize = defaultPageSize } = pagination;
    const offset = page > 0 ? (page - 1) * pageSize : 0;
    return (0, utils_1.pgFormat)('OFFSET $<offset>', { offset });
};
exports.default = {
    pageSize,
    page
};
