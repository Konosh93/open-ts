/* eslint-disable no-console */
export function warn(msg: string): void {
    console.warn("\x1b[33m%s\x1b[0m", msg);
}
