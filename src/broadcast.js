import Observable from './observable'

function getName(channelName) {
  return `bdlite-observable-broadcast-${channelName}`;
}

export function broadcast(channelName) {
  return (observable) => {
    const obPrototype = Object.getPrototypeOf(observable);

    if (obPrototype.isBroadCasted) return;

    if (typeof channelName !== 'string') throw new Error('[Observable: broadcast] oparator must has name to create a BroadcastChannel instance');

    const name = getName(channelName);
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
          bc.postMessage({ type: 'getData', data: getData() });
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
        bc.postMessage({ type: 'next', data: getData() });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] next function \n ${ e}`));
      }
    }

    function broadcastError(...dataArgs) {
      if (!error(...dataArgs)) return;

      try {
        bc.postMessage({ type: 'error' });
      } catch (e) {
        console.error(new Error(`[Observable: broadcast] error function \n ${ e}`));
      }
    }

    Object.setPrototypeOf(observable, { ...obPrototype, getData, isBroadCasted: true });
    observable.next = broadcastNext;
    observable.error = broadcastError;
    observable.subscribe = broadcastSubscribe;
  }
}

export function SubChannel(channelName) {
  const subBC = new BroadcastChannel(getName(channelName));

  this.watch = (callback) => {
    subBC.addEventListener('message', (ev) => {
      const { data } = ev;

      if (!data) return;

      try {
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
    subBC.postMessage({ type: 'getData', isSubChannel: true });
  }
}