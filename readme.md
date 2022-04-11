# 小程序如何使用 stomp

## 安装 `npm i wechat-stomp`

## 1. 初始化连接 建议在 app.js

> ### `wxStompClient` 是全局的一个 stompClient
> ### `wxStompClient.connect(socketConfig, stompConnectConfig)`
>

```js
import {wxStompClient} from 'wechat-stomp'

wxStompClient.connect({
    url: 'ws://localhost:8080/stomp/websocket',
    header: {
        'content-type': 'application/json',
    },
}, {})
```

### 2.使用 behavior 的方式

> ### 订阅消息 this._stompSubscribe(destination, callback)
> ### 解除订阅 this._stompUnsubscribe(destination)
> ### 发送消息 this._stompSend()
>

```js
import {StompBehavior, wxStompClient} from 'wechat-stomp'

Page({
    behaviors: [StompBehavior]
})
```

### 系统主要功能

- 支持使用`behaviors`方式使用stomp的API
- 支持`web socket`连接断开自动重连
- 支持主题订阅后断开支持自动恢复功能
