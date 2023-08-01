import Observable from './observable'
import { generateUUID } from './utils'

function getName(channelName, useSession) {
  const name = `observable-rx-broadcast-${channelName}`;

  if (!useSession) return name;

  let sessionName = window.sessionStorage.getItem(name);

  if (!sessionName) {
    sessionName = generateUUID();
    window.sessionStorage.setItem(name, sessionName);
  }

  return sessionName
}


export function broadcast(channelName, channelOptions) {
  return (observable) => {
    const obPrototype = Object.getPrototypeOf(observable);

    if (obPrototype.isBroadCasted) return;

    if (typeof channelName !== 'string') throw new Error('[Observable: broadcast] oparator must has name to create a BroadcastChannel instance');

    const { useSession = true } = channelOptions || {};
    const name = getName(channelName, useSession);
    const bc = new BroadcastChannel(name);

    const options = observable.getOptions();
    const next = obPrototype.next.bind(observable);
    const error = obPrototype.error.bind(observable);
    const getData = obPrototype.getData.bind(observable);
    const getStatus = obPrototype.getStatus.bind(observable);

    bc.addEventListener('message', (ev) => {
      const { data } = ev;

      if (!data) return;

      if (data.type === 'getData') {
        try {
          bc.postMessage({ channelName, type: 'next', data: getData() });
        } catch (e) {
          console.error(new Error(`[Observable: broadcast] addEventListener callback \n ${ e}`));
        }
      }
    });

    function broadcastSubscribe(...subArgs) {
      const subBC = new BroadcastChannel(name);
      const imitatedObservable = new Observable({ options, status: getStatus(), initialData: getData() });
      const imitatedSubscription = imitatedObservable.subscribe(...subArgs);

      subBC.addEventListener('message', (ev) => {
        const { data } = ev;

        if (!data) return;

        if (data.type === 'next') {
          imitatedObservable.next(data.data);
        }

        if (data.type === 'error') {
          imitatedObservable.error();
        }
      });

      if (options.relay > 0) {
        subBC.postMessage({ channelName, type: 'getData', isSubChannel: true });
      }

      return {
        ...imitatedSubscription,
        unsubscribe: (...unsubArgs) => {
          subBC.close();
          return imitatedSubscription.unsubscribe(...unsubArgs);
        }
      }
    }

    function broadcastNext(...dataArgs) {
      if (!next(...dataArgs)) return;

      try {
        bc.postMessage({ channelName, type: 'next', data: getData() });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] next function \n ${ e}`));
      }
    }

    function broadcastError(...dataArgs) {
      if (!error(...dataArgs)) return;

      try {
        bc.postMessage({ channelName, type: 'error' });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] error function \n ${ e}`));
      }
    }

    function close() {
      bc.close();
    }

    Object.setPrototypeOf(observable, { ...obPrototype, getData, close, isBroadCasted: true });
    observable.next = broadcastNext;
    observable.error = broadcastError;
    observable.subscribe = broadcastSubscribe;
  }
}

export function SubChannel(channelName, channelOptions) {
  const { useSession = true } = channelOptions || {};
  const subBC = new BroadcastChannel(getName(channelName, useSession));

  this.watch = (callback) => {
    subBC.addEventListener('message', (ev) => {
      const { data } = ev;

      if (!data) return;

      try {
        if (data.type === 'getData') return;

        callback(data);
      } catch (e) {
        console.error(new Error(`[Observable: SubChannel] addEventListener callback \n ${ e}`));
      }
    });
  }

  this.close = () => {
    subBC.close();
  }

  this.ask = () => {
    subBC.postMessage({ channelName, type: 'getData', isSubChannel: true });
  }
}
