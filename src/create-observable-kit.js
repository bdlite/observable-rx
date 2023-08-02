import Observable from './observable'
import SubChannel from './subchannel'
import { broadcast } from './broadcast'
import { share } from './share'


export function createObservableKit(initialData, options, { channelName = '' } = {}) {
  const observable = new Observable({ initialData, options: options || { relay: 1 } })

  /**
   * @function subscribe
   * @param {function | object} callbackOrConfig
   * @param {?function} beforeUnsubscribe
   * @returns {function} unsubscribe
  */
  function subscribe(callbackOrConfig, beforeUnsubscribe) {
    let subscription = observable.subscribe(callbackOrConfig) // 这里不用const，为了能释放内存

    return () => {
      if (typeof beforeUnsubscribe === 'function') {
        beforeUnsubscribe()
      }

      subscription.unsubscribe()
      subscription = null
    }
  }

  /**
   * @function publish
   * @param {any} data
  */
  function publish(data) {
    observable.next(data)
  }


  if (channelName) {
    broadcast(channelName)(observable) // 转跨页面广播模式
    return { observable, publish, subscribe }
  }

  share()(observable) // 转发布订阅模式
  return { observable, publish, subscribe }
}


export function createSubChannelKit({ channelName = '' } = {}, options) {
  /**
   * @function subscribe
   * @param {function | object} observer
   * @param {?function} beforeUnsubscribe
   * @returns {function} unsubscribe
  */
  function subscribe(observer, beforeUnsubscribe) {
    let subChannel = new SubChannel(channelName) // 这里不用const，为了能释放内存
    let callback = null

    if (typeof observer === 'function') {
      callback = observer
    } else if (typeof observer?.next === 'function') {
      callback = observer.next
    }

    subChannel.watch(nextData => {
      callback && callback(nextData?.data)
    })

    if (options?.relay > 0) {
      subChannel.ask()
    }

    return () => {
      if (typeof beforeUnsubscribe === 'function') {
        beforeUnsubscribe()
      }

      subChannel.close()
      subChannel = null
      callback = null
    }
  }

  return { subscribe }
}
