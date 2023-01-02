export enum QueryErrorTypes {
    NoUpdateColumns = 'NoUpdateColumns',
    EmptyQuery = 'EmptyQuery',
    MultipleRowsReturned = 'MultipleRowsReturned',
    ExecutionError = 'ExecutionError',
    ConstraintViolation = 'ConstraintViolation'
}

export enum ConnectionErrorTypes {
    '28P01' = 'AuthFailed',
    '3D000' = 'DatabaseNotFound',
    ENOTFOUND = 'HostNotFound',
    ECONNREFUSED = 'PortNotResponding'
}
