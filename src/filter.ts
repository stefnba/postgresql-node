import { pgFormat } from './utils';

import type { FilterOperatorParams } from './types';

export const filterOperators = {
    NULL: () => 'IS NULL',
    NOT_NULL: () => 'IS NOT NULL',
    INCLUDES: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> IN ($<value:list>)', {
            column,
            value,
            alias
        }),
    EXCLUDES: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> NOT IN ($<value:list>)', {
            column,
            value,
            alias
        }),
    EQUAL: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> = $<value>', {
            column,
            value,
            alias
        }),
    NOT_EQUAL: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> != $<value>', {
            column,
            value,
            alias
        }),
    GREATER_EQUAL: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> >= $<value>', {
            column,
            value,
            alias
        }),
    GREATER: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> > $<value>', {
            column,
            value,
            alias
        }),
    LESS_EQUAL: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> <= $<value>', {
            column,
            value,
            alias
        }),
    LESS: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:name>.$<column:name> < $<value>', {
            column,
            value,
            alias
        }),
    LIKE: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat(
            "LOWER($<alias:name>.$<column:name>) LIKE LOWER('%$<value:value>%')",
            { column, value, alias }
        )
};
