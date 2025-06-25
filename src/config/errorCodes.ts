export interface IErrors{
    [key: string]: string
    P2002 : string
    P2003 : string
    P2007 : string
    P2014 : string
}
export const errors: IErrors = {
    'P2002': 'Given non unique value',
    'P2003': 'Field is not found',
    'P2007': 'Data validation error',
    'P2014': 'Error in relations',
}