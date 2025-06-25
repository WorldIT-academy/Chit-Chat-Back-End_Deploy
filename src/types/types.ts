export interface IError {
    status: 'error',
    message: string
}

export interface IOkWithData<T>{
    status: 'success',
    data: T
}
export interface IOk{
    status: 'success',
    message: string
}