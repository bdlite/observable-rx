import Observable from './observable'
import { share } from './share'

export function createObservableKit(initialData, options) {
  const observable = new Observable({ initialData, options: options || { relay: 1 } })
  share()(observable) // 转多播

  /**
   * @function subscribe
   * @param {function | object} mountedFunOrConfig
   * @param {?function} unmountedFun
   * @returns {function} unsubscribe
  */
  function subscribe(mountedFunOrConfig, unmountedFun = () => {}) {
    let subscription = observable.subscribe(mountedFunOrConfig) // 这里不用const，是想能释放内存

    return () => {
      unmountedFun()
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

  return { observable, publish, subscribe }
}