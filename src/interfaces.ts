export interface Options {
  relay?: number;
  [key: string]: any;
}

export interface Status {
  isUnSub: boolean;
  hasData: boolean;
  hasError: boolean;
  [key: string]: any;
}

export interface Props {
  initialData?: any;
  options?: Options;
  status?: Status;
}

export interface Callback {
  (data?: any): void;
}

export interface Observer {
  next?: Callback;
  error?: Callback;
  complete?: Callback;
}

export interface Subscription {
  unsubscribe: () => void;
  [key: string]: any;
}

export function getPlainFun(fun?: Callback): Callback {
  return typeof fun === 'function' ? fun : () => {};
}

