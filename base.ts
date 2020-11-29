/*
 * This file is auto-generated. Do NOT modify this file manually.
*/

type OperationWithoutBody = (
    path: string,
    query: { [key: string]: any }
) => Promise<any>;
type OperationWithBody = (
    path: string,
    body: any,
    query: { [key: string]: any }
) => Promise<any>;

export interface HTTPClient {
    get: OperationWithoutBody;
    post: OperationWithBody;
    put: OperationWithBody;
    delete: OperationWithoutBody;
    patch: OperationWithBody;

    setHeaders: (headers: { [key: string]: string }) => void;
}
