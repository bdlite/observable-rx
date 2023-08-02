import Observable from './observable'
import { getName } from './utils'


export function broadcast(channelName, channelOptions) {
  return (observable) => {
    const obPrototype = Object.getPrototypeOf(observable);

    if (obPrototype.isBroadCasted) return;

    if (typeof channelName !== 'string') throw new Error('[Observable: broadcast] oparator must has name to create a BroadcastChannel instance');

    const { useSession = true } = channelOptions || {};
    const name = getName(channelName, useSession);
    const bc = new BroadcastChannel(name);

    const subCollection = new Map();

    const options = observable.getOptions();
    const next = obPrototype.next.bind(observable);
    const error = obPrototype.error.bind(observable);
    const getData = obPrototype.getData.bind(observable);
    const getStatus = obPrototype.getStatus.bind(observable);

    bc.addEventListener('message', (ev) => {
      const { data } = ev;

      if (!data) return;

      const { type, timestamp } = data;

      if (type === 'getData') {
        try {
          bc.postMessage({ channelName, timestamp, type: 'next', data: getData() });
        } catch (e) {
          console.error(new Error(`[Observable: broadcast] addEventListener callback \n ${ e}`));
        }
      }
    });

    function mainChannelSubscribe(...subArgs) {
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

    function broadcastNext(...dataArgs) {
      if (!next(...dataArgs)) return;

      const data = getData();

      try {
        bc.postMessage({ channelName, type: 'next', data });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] next function \n ${ e}`));
      }

      for (const [ , imitatedObservable ] of subCollection) {
        imitatedObservable.next(data);
      }
    }

    function broadcastError(...dataArgs) {
      if (!error(...dataArgs)) return;

      try {
        bc.postMessage({ channelName, type: 'error' });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] error function \n ${ e}`));
      }

      for (const [ , imitatedObservable ] of subCollection) {
        imitatedObservable.error();
      }
    }

    function close() {
      bc.close();
    }

    Object.setPrototypeOf(observable, { ...obPrototype, getData, close, isBroadCasted: true });
    observable.next = broadcastNext;
    observable.error = broadcastError;
    observable.subscribe = mainChannelSubscribe;
  }
}