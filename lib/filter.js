"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOperators = void 0;
const utils_1 = require("./utils");
exports.filterOperators = {
    NULL: () => 'IS NULL',
    NOT_NULL: () => 'IS NOT NULL',
    INCLUDES: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> IN ($<value:list>)', {
        column,
        value,
        alias
    }),
    EXCLUDES: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> NOT IN ($<value:list>)', {
        column,
        value,
        alias
    }),
    EQUAL: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> = $<value>', {
        column,
        value,
        alias
    }),
    NOT_EQUAL: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> != $<value>', {
        column,
        value,
        alias
    }),
    GREATER_EQUAL: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> >= $<value>', {
        column,
        value,
        alias
    }),
    GREATER: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> > $<value>', {
        column,
        value,
        alias
    }),
    LESS_EQUAL: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> <= $<value>', {
        column,
        value,
        alias
    }),
    LESS: ({ column, alias, value }) => (0, utils_1.pgFormat)('$<alias:name>.$<column:name> < $<value>', {
        column,
        value,
        alias
    }),
    LIKE: ({ column, alias, value }) => (0, utils_1.pgFormat)("LOWER($<alias:name>.$<column:name>) LIKE LOWER('%$<value:value>%')", { column, value, alias })
};
