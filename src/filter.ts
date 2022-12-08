import { pgFormat } from './utils';

import type { FilterOperatorParams } from './types';

export const filterOperators = {
    NULL: () => 'IS NULL',
    NOT_NULL: () => 'IS NOT NULL',
    INCLUDES: ({ column, alias, value }: FilterOperatorParams) =>
        pgFormat('$<alias:alias>.$<column:name> IN ($<values:list>)', {
            column,
            value,
            alias
        })
};
