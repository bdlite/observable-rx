const voidFun = () => {};
const getPlainFun = (fun) => typeof fun === 'function' ? fun : voidFun;

export default class Observable {
  constructor({ initialData, options, status } = {}) {
    this.data = initialData;
    this.options = options || { relay: 0 };
    this.status = { isUnSub: false, hasData: false, hasError: false, ...(status || {}) };
    this.pubConfig = { publish: voidFun, errorPub: voidFun };
  }

  getData() {
    return this.data;
  }

  getStatus() {
    return {
      hasData: this.status.hasData,
      hasError: this.status.hasError,
    }
  }

  setStatus(status = {}) {
    Object.assign(this.status, { ...status });
  }

  getOptions() {
    return { ...this.options };
  }

  canPubImidiately() {
    return this.options.relay > 0 && this.status.hasData;
  }

  canThrowErrorImidiately() {
    return this.options.relay > 0 && this.status.hasError;
  }

  publishData() {
    if (this.status.isUnSub) return;
    this.pubConfig.publish(this.data);
  }

  publishError() {
    if (this.status.isUnSub) return;
    this.pubConfig.errorPub();
  }

  next(nextData) {
    Object.assign(this.status, {
      hasData: true,
      hasError: false,
    });
    this.data = nextData;

    if (this.status.isUnSub) return false;

    this.pubConfig.publish(nextData);

    return true;
  }

  error(errData) {
    Object.assign(this.status, { hasError: true });

    if (this.status.isUnSub) return false;

    this.pubConfig.errorPub(errData);

    return true;
  }

  subscribe(observer) {
    const subscription = {
      unsubscribe: () => {
        this.status.isUnSub = true;
      }
    }

    if (typeof observer === 'function') {
      this.pubConfig.publish = observer;
    } else if (observer) {
      Object.assign(this.pubConfig, {
        ...observer,
        publish: getPlainFun(observer.next),
        errorPub: getPlainFun(observer.error),
      })
    }

    if (this.canPubImidiately()) {
      this.publishData();
    } else if (this.canThrowErrorImidiately()) {
      this.publishError();
    }

    return subscription;
  }
}
