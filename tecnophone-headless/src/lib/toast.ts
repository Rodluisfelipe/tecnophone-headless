type ToastType = 'success' | 'error' | 'info';

export type ToastHandler = (
  message: string,
  opts?: { description?: string; type?: ToastType }
) => void;

let handler: ToastHandler = () => {};

export function registerToastHandler(fn: ToastHandler) {
  handler = fn;
}

export function unregisterToastHandler() {
  handler = () => {};
}

export const toast = {
  success: (message: string, opts?: { description?: string }) =>
    handler(message, { ...opts, type: 'success' }),
  error: (message: string, opts?: { description?: string }) =>
    handler(message, { ...opts, type: 'error' }),
  info: (message: string, opts?: { description?: string }) =>
    handler(message, { ...opts, type: 'info' }),
};
