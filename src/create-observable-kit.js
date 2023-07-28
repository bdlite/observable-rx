import Observable from './observable'
import { SubChannel, broadcast } from './broadcast'
import { share } from './share'

export function createObservableKit(initialData, options, { channelName = '' } = {}) {
  const observable = new Observable({ initialData, options: options || { relay: 1 } })

  /**
   * @function subscribe
   * @param {function | object} mountedFunOrConfig
   * @param {?function} unmountedFun
   * @returns {function} unsubscribe
  */
  function subscribe(mountedFunOrConfig, unmountedFun) {
    let subscription = observable.subscribe(mountedFunOrConfig) // 这里不用const，为了能释放内存

    return () => {
      if (typeof unmountedFun === 'function') {
        unmountedFun()
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
    let data = initialData
    const getDataFromChannel = () => data // 消费通道如果不用订阅方法，可以通过闭包同步取值
    const subChannel = new SubChannel(channelName) // 如果作为发布通道，也有可能同时作为消费通道，因此暂时不做懒加载

    subChannel.watch(nextData => {
      data = nextData
    })

    broadcast(channelName)(observable) // 转跨页面广播模式

    return { observable, getDataFromChannel, publish, subscribe }
  }

  share()(observable) // 转发布订阅模式
  return { observable, publish, subscribe }
}
