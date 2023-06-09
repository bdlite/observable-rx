import Observable from './observable'

export function share() {
  return (observable) => {
    const obPrototype = Object.getPrototypeOf(observable);

    if (obPrototype.isShared) return;

    const subCollection = new Map();
    const options = observable.getOptions();
    const next = obPrototype.next.bind(observable);
    const error = obPrototype.error.bind(observable);
    const getData = obPrototype.getData.bind(observable);
    const getStatus = obPrototype.getStatus.bind(observable);

    function sharedSubscribe(...subArgs) {
      const symbol = Symbol('');
      const imitatedObservable = new Observable({ options, status: getStatus(), initialData: getData() });
      const imitatedSubscription = imitatedObservable.subscribe(...subArgs);

      subCollection.set(symbol, imitatedObservable);

      return {
        ...imitatedSubscription,
        unsubscribe: (...unsubArgs) => {
          subCollection.delete(symbol);
          return imitatedSubscription.unsubscribe(...unsubArgs);
        }
      }
    }

    function sharedNext(...dataArgs) {
      if (!next(...dataArgs)) return;

      const data = getData();

      for (const [ , imitatedObservable ] of subCollection) {
        imitatedObservable.next(data);
      }
    }

    function sharedError(...dataArgs) {
      if (!error(...dataArgs)) return;

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