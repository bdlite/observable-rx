import { getName } from './utils'

export default function SubChannel(channelName, channelOptions) {
  const timestamp = new Date().getTime();
  const { useSession = true } = channelOptions || {};
  const subBC = new BroadcastChannel(getName(channelName, useSession));

  this.watch = (callback) => {
    subBC.addEventListener('message', (ev) => {
      const { data } = ev;

      if (!data) return;

      try {
        const { type, timestamp: _timestamp } = data;

        if (type === 'getData') return;

        if (_timestamp && _timestamp !== timestamp) return;

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
    subBC.postMessage({ channelName, timestamp, type: 'getData', isSubChannel: true });
  }
}