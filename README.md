# Observable-RX 文档

## 简介

Observable-RX是支持发布订阅模式、BroadcastChannel跨页面交互模式的JavaScript库，用于处理异步数据流。它提供了一种优雅的方式来处理异步数据流，使得代码更易于理解和维护。

元对象基于观察者模式，扩展为运行时的发布订阅模式、跨页面的事件交互模式。事件模式同时包含两种模式，使主通道立即发布给同一环境内的订阅者，避免等待消息的延时问题。

有别于RxJS的使用，其中一点是，当发出了error事件，不需要retry（吐槽下retry也没用），next跟error可以同时不限制地使用，这也是自研的原因之一。

## 安装

使用npm安装：

```js
 npm install observable-rx
```

## 使用

### 创建Observable

要创建一个Observable，只需调用Observable构造函数即可。

```js
import { Observable } from 'observable-rx';

const observable = new Observable();
```

### 订阅Observable

要订阅Observable，调用subscribe方法并传入一个观察者对象。观察者对象应该具有next、error方法，用于处理Observable发出的值和错误信号。

```js
import { Observable } from 'observable-rx';

const observable = new Observable();

// 订阅可观察对象
const subscription = observable.subscribe({
  next: (value) => console.log(value),
  error: (value) => console.error(value),
});

// 取消订阅
subscription.unsubscribe();
```

### 发布Observable

使用Observable的next方法，需要先创建一个Observable对象并调用subscribe方法进行订阅。

在观察者对象中，可以定义next方法来处理Observable发出的值。例如：

```js
import { Observable } from 'observable-rx';

const observable = new Observable();

// 订阅可观察对象
observable.subscribe({
  next: (value) => console.log(value),
  error: (value) => console.error(value),
});

// 在需要的地方，调用Observable的next方法
setTimeout(() => {
    observable.next('hello world');
}, 3000);
```

在上面的代码中，我们调用了Observable的next方法并传入了一个字符串作为参数。

当Observable发出这个值时，观察者对象的next方法将被调用并传入该值作为参数。

需要注意的是，如果Observable还没有被订阅，调用next方法将不会有任何效果。

如果你需要获取到上一次的值，在创建observable的时候，加上配置项`relay`：

```js
import { Observable } from 'observable-rx';

// 传入options，配置relay为1
const observable = new Observable({ options: { relay: 1 } });

// 调用Observable的next方法
observable.next('hello world');

// 订阅可观察对象
observable.subscribe({
  next: (value) => console.log(value), // 会立即被调用一次
  error: (value) => console.error(value),
});
```

由于relay大于0，即使订阅在 `observable.next('hello world')` 之后执行，subscribe中的next回调也会被执行。

如果开启共享模式，即使订阅在值被发出之后执行，所有观察者对象的next方法都将被立即调用。

relay选项指定了Observable发出值的数量，而不是订阅的数量。

> 目前没有真正实现relay的次数，仅判断是否大于0，因此当relay大于0时，所有next回调都只会被立即执行1次。

### 抛出错误Observable

使用Observable的error方法，在观察者对象中，可以定义error方法来处理Observable发出的错误。例如：

```js
import { Observable } from 'observable-rx';

const observable = new Observable({ options: { relay: 1 } });

// 订阅可观察对象
observable.subscribe({
  next: (value) => console.log(value),
  error: (value) => console.error(value),
});

// 出现异常时，调用Observable的error方法
setTimeout(() => {
    observable.error('something wrong');
}, 5000);
```

在上面的代码中，我们调用了Observable的error方法并传入了一个字符串作为错误信息。当Observable发出这个值时，观察者对象的error方法将被调用并传入该值作为参数。

> 注意，错误不会因为relay配置而缓存下来，订阅时机在 `observable.error('timeout')` 执行之前不会获取历史错误信息。

### 共享Observable

Observable提供了一个share操作符，用于共享Observable的订阅，真正实现发布订阅模式，而不是一对一响应。

```js
import { Observable, share } from 'observable-rx';

const observable = new Observable({ options: { relay: 1 } });

// 该操作会重载部分observable的方法
share()(observable);

// 调用Observable的next方法
observable.next('hello world');

// 调用Observable的error方法
setTimeout(() => {
    observable.error('timeout');
}, 5000);

// 只能监听到next事件
observable.subscribe((value) => console.log('subscribe-1: ', value));

// 监听多种事件
observable.subscribe({
  next: (value) => console.log('subscribe-2-next: ', value),
  error: (value) => console.error('subscribe-2-error: ', value),
});

// 再次调用Observable的next方法
observable.next('hello again');
```

> 未开启共享模式时，重复调用 `observable.subscribe` 只会覆盖之前的回调。

## API文档

### 构造函数

### Observable

- `new Observable(props?: Props): Observable`

    创建一个新的Observable。

    参数：

    - props: 可选参数对象，包含以下属性：
        - initialData: 初始数据
        - options: 选项对象，包含以下属性：
            - relay: 是否在订阅时立即发布上一次的数据，传入大于0的relay值即可

    返回值：

    - Observable实例

    ```js
    import { Observable } from 'observable-rx';

    const observable = new Observable({ initialData: {}, options: { relay: 1 } });
    ```

### 实例方法

- `subscribe(observer: Observer | Callback): Subscription`

    订阅Observable。

    参数：

    - observer: 观察者对象，包含以下属性：
        - next: 数据处理函数，接收一个数据参数
        - error: 错误处理函数，接收一个错误参数

    或者：

    - callback: next回调，数据处理函数，接收一个数据参数

    返回值：

    - Subscription

    ```js
    const subscription = observable.subscribe({
        next: (value) => console.log(value),
        error: (value) => console.error(value),
    });

    subscription.unsubscribe();
    ```
    或者

    ```js
    const subscription = observable.subscribe((value) => console.log(value));

    subscription.unsubscribe();
    ```

- `next(data: any): void`

    向 Observer 发送数据。

    参数：

    - data: 要发送的数据

    返回值：

    - void

    ```js
    observable.next('hello world');
    ```

- `error(data: any): void`

    向 Observer 发送错误信息。

    参数：

    - data: 要发送的错误

    返回值：

    - void

    ```js
    observable.error('something went wrong');
    ```

### Operators

- `share`

    共享Observable的订阅。

    ```js
    import { share } from 'observable-rx';

    share()(observable);

    observable.subscribe((value) => console.log('subscribe shared observable 1: ', value));

    observable.subscribe({
        next: (value) => console.log('subscribe shared observer 2-next: ', value),
        error: (value) => console.error('subscribe shared observer 2-error: ', value),
    });
    ```
- `broadcast`

   使用 BroadcastChannel API来实现订阅，支持跨页面同步数据。

### 创建套件

 - `createObservableKit`

 - `createSubChannelKit`

## 特别说明

如您有意使用，欢迎联系本人yexinxie@163.com，这个小项目会根据您的意见修改并添加测试用例。

> If you are interested in using it, please contact me at yexinxie@163.com. This small project will be modified and test cases will be added according to your feedback.

## 本库参考

- [RxJS官方文档](https://rxjs.dev/guide/observable)
