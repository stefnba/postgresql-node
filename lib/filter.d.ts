import type { FilterOperatorParams } from './types';
export declare const filterOperators: {
    NULL: () => string;
    NOT_NULL: () => string;
    INCLUDES: ({ column, alias, value }: FilterOperatorParams) => string;
    EXCLUDES: ({ column, alias, value }: FilterOperatorParams) => string;
    EQUAL: ({ column, alias, value }: FilterOperatorParams) => string;
    NOT_EQUAL: ({ column, alias, value }: FilterOperatorParams) => string;
    GREATER_EQUAL: ({ column, alias, value }: FilterOperatorParams) => string;
    GREATER: ({ column, alias, value }: FilterOperatorParams) => string;
    LESS_EQUAL: ({ column, alias, value }: FilterOperatorParams) => string;
    LESS: ({ column, alias, value }: FilterOperatorParams) => string;
    LIKE: ({ column, alias, value }: FilterOperatorParams) => string;
};
