// This section of TypeScript code has not been validated yet, please use with caution.

import Observable from './observable';
import { Subscription } from './interfaces';

export function share(): (observable: Observable<any>) => void {
  return (observable: Observable<any>) => {
    const obPrototype = Object.getPrototypeOf(observable);

    if (obPrototype.isShared) return;

    const subCollection = new Map<symbol, Observable<any>>();

    const next = obPrototype.next.bind(observable);
    const error = obPrototype.error.bind(observable);
    const getData = obPrototype.getData.bind(observable);
    const getStatus = obPrototype.getStatus.bind(observable);

    function sharedSubscribe(...subArgs: any[]): Subscription {
      const symbol = Symbol();
      const options = observable.getOptions();
      const imitatedObservable = new Observable({ options, status: getStatus(), initialData: getData() });
      const imitatedSubscription = imitatedObservable.subscribe(...subArgs);

      subCollection.set(symbol, imitatedObservable);

      return {
        ...imitatedSubscription,
        unsubscribe: (...unsubArgs: any[]) => {
          subCollection.delete(symbol);
          return imitatedSubscription.unsubscribe(...unsubArgs);
        }
      }
    }

    function sharedNext(...dataArgs: any[]): void {
      next(...dataArgs);

      for (const [ , imitatedObservable ] of subCollection) {
        imitatedObservable.next(getData());
      }
    }

    function sharedError(...dataArgs: any[]): void {
      error(...dataArgs);

      for (const [ , imitatedObservable ] of subCollection) {
        imitatedObservable.error();
      }
    }

    Object.setPrototypeOf(observable, { isShared: true })
    observable.next = sharedNext;
    observable.error = sharedError;
    observable.subscribe = sharedSubscribe;
  }
}