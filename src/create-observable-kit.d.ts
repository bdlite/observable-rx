// This file has not been validated and is for reference only.

import { Callback, Observer } from './interfaces';
import Observable from './observable';
import { share } from './share';


interface SubscribeFunction {
  (
    mountedFunOrConfig: Observer | ((value: any) => void),
    unmountedFun?: () => void
  ): () => void;
}

interface ObservableKit {
  observable: Observable;
  publish: (data: any) => void;
  subscribe: SubscribeFunction;
}

export function createObservableKit(initialData: any, options?: any): ObservableKit {
  const observable = new Observable({ initialData, options: options || { relay: 1 } });
  share()(observable);

  function subscribe(mountedFunOrConfig: Observer | Callback, unmountedFun?: () => void): () => void {
    let subscription = observable.subscribe(mountedFunOrConfig);

    return () => {
      unmountedFun();
      subscription.unsubscribe();
      subscription = null;
    }
  }

  function publish(data: any): void {
    observable.next(data);
  }

  return { observable, publish, subscribe };
}