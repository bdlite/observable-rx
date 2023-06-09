// This section of TypeScript code has not been validated yet, please use with caution.
import { Options, Status, Props, Callback, Observer, Subscription, getPlainFun } from './interfaces';


export default class Observable {
  private data: any;
  private options: Options;
  private status: Status;
  private pubConfig: {
    publish: Callback;
    errorPub: Callback;
  };
  
  constructor({ initialData, options, status }: Props = {}) {
    this.data = initialData;
    this.options = options || { relay: 0 };
    this.status = { isUnSub: false, hasData: false, hasError: false, ...(status || {}) };
    this.pubConfig = { publish: getPlainFun(), errorPub: getPlainFun() };
  }

  private unsubscribe(): void {
    this.status.isUnSub = true;
  };

  public getData(): any {
    return this.data;
  }

  public getStatus(): { hasData: boolean, hasError: boolean } {
    return {
      hasData: this.status.hasData,
      hasError: this.status.hasError,
    }
  }

  public setStatus(status?: Status): void {
    Object.assign(this.status, status);
  }

  public getOptions(): Options {
    return { ...this.options };
  }

  public canPubImidiately(): boolean {
    return this.options.relay > 0 && this.status.hasData;
  }

  public canThrowErrorImidiately(): boolean {
    return this.options.relay > 0 && this.status.hasError;
  }

  public publishData(): void {
    if (this.status.isUnSub) return;
    this.pubConfig.publish(this.data);
  }

  public publishError(): void {
    if (this.status.isUnSub) return;
    this.pubConfig.errorPub();
  }

  public next(nextData: any): void {
    Object.assign(this.status, { hasData: true, hasError: false });

    this.data = nextData;

    if (this.status.isUnSub) return;

    this.pubConfig.publish(nextData);
  }

  public error(errData: any): void {
    Object.assign(this.status, { hasError: true });

    if (this.status.isUnSub) return;

    this.pubConfig.errorPub(errData);
  }

  public subscribe(observer: Observer | Callback): Subscription {
    if (typeof observer === 'function') {
      this.pubConfig.publish = observer;
    } else if (observer) {
      Object.assign(this.pubConfig, {
        publish: getPlainFun(observer.next),
        errorPub: getPlainFun(observer.error),
      })
    }

    if (this.canPubImidiately()) {
      this.publishData();
    } else if (this.canThrowErrorImidiately()) {
      this.publishError();
    }

    return {
      unsubscribe: () => {
        this.unsubscribe();
      }
    };
  }
}