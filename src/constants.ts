export enum QueryErrorTypes {
    NoUpdateColumns = 'NoUpdateColumns',
    EmptyQuery = 'EmptyQuery',
    MultipleRowsReturned = 'MultipleRowsReturned',
    ExecutionError = 'ExecutionError',
    ConstraintViolation = 'ConstraintViolation',
    NotNullViolation = 'NotNullViolation'
}

export enum ConnectionErrorTypes {
    '28P01' = 'AuthFailed',
    '3D000' = 'DatabaseNotFound',
    ENOTFOUND = 'HostNotFound',
    ECONNREFUSED = 'PortNotResponding'
}

export const DEFAULT_PAGE_SIZE = 25;
