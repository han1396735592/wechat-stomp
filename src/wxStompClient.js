import {Stomp} from './stomp.min'

Stomp.setInterval = function (interval, f) {
    return setInterval(f, interval);
};
Stomp.clearInterval = function (id) {
    return clearInterval(id);
};

class EventDispatcher {
    addEventListener(type, listener) {
        if (this._listeners === undefined) this._listeners = {};
        const listeners = this._listeners;
        if (listeners[type] === undefined) {
            listeners[type] = [];
        }
        if (listeners[type].indexOf(listener) === -1) {
            listeners[type].push(listener);
        }
    }

    hasEventListener(type, listener) {
        if (this._listeners === undefined) return false;
        const listeners = this._listeners;
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }

    removeEventListener(type, listener) {
        if (this._listeners === undefined) return;
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1) {
                listenerArray.splice(index, 1);
            }
        }
    }

    dispatchEvent(event) {
        if (this._listeners === undefined) return;
        const listeners = this._listeners;
        const listenerArray = listeners[event.type];
        if (listenerArray !== undefined) {
            event.target = this;
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}


class WxStompClient extends EventDispatcher {
    socketTask
    stompClient
    autoConnect = true
    autoConnectTimeout = 15000
    socketConfig
    stompConnectConfig
    stompWs
    autoConnectTimerId
    connected = false

    doAutoConnect(isNow) {
        let that = this
        let timeout = isNow ? 0 : that.autoConnectTimeout
        if (isNow) {
            that.autoConnect = true
        }
        clearTimeout(that.autoConnectTimerId)
        if (that.autoConnect) {
            console.debug("try auto connect timeout [" + timeout + "]ms")
            that.autoConnectTimerId = setTimeout(() => {
                that.connect(that.socketConfig, that.stompConnectConfig)
            }, timeout)
        }
    }

    _init() {
        let that = this
        that.stompWs = {
            send(msg) {
                return new Promise((resolve, reject) => {
                    if (that.socketTask && that.socketTask.readyState === 1) {
                        that.socketTask.send({
                            data: msg,
                            success() {
                                resolve()
                            },
                            fail() {
                                reject()
                            }
                        })
                    } else {
                        reject("socketTask is not open")
                    }
                })
            },
            close() {
                if (that.socketTask) {
                    try {
                        that.socketTask.close()
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
        }
        that.stompClient = Stomp.over(that.stompWs);
        that.stompClient.debug = console.debug
    }

    constructor(autoConnect = true, autoConnectTimeout = 15000) {
        super();
        this.autoConnect = autoConnect;
        this.autoConnectTimeout = autoConnectTimeout
    }

    connect(socketConfig, stompConnectConfig = {}) {
        let that = this
        that.socketConfig = socketConfig
        that.stompConnectConfig = stompConnectConfig
        console.debug('stomp connect', socketConfig, stompConnectConfig)
        if (!that.connected) {
            this._init()
            that.socketTask = wx.connectSocket({
                ...socketConfig,
                success(res) {
                    that.stompClient.connect(stompConnectConfig, function (frame) {
                        console.debug('stomp connect success')
                        that.connected = true
                        that.dispatchEvent({
                            type: 'stomp-connected',
                            data: frame
                        })
                    }, (e) => {
                        console.debug('stomp connect error')
                        that.connected = false
                        that.dispatchEvent({
                            type: 'stomp-connect-error',
                            data: e
                        })
                        that.doAutoConnect()
                    })
                },
                fail(res) {
                    console.log(res)
                    that.doAutoConnect()
                    that.connected = false
                }
            })
            try {
                that.socketTask.onClose(function (res) {
                    console.debug("socketTask.onClose", res)
                    that.connected = false
                    that.dispatchEvent({
                        type: 'socket-close',
                        data: res
                    })
                    if (that.stompClient) {
                        that.stompClient.connected = false
                        that.stompClient.disconnect()
                    }
                    that.stompClient = null
                    that.socketTask = null
                    that.doAutoConnect()
                })
            } catch (e) {
                console.error(e)
            }
            try {
                that.socketTask.onOpen(function (res) {
                    console.debug('WebSocket连接已打开！')
                    that.dispatchEvent({
                        type: 'socket-open',
                        data: res
                    })
                    that.stompWs.onopen && that.stompWs.onopen()
                })
            } catch (e) {
                console.error(e)
            }
            try {
                that.socketTask.onMessage(function (res) {
                    that.stompWs.onmessage && that.stompWs.onmessage(res)
                })
            } catch (e) {
                console.error(e)
            }
        }
    }

    close() {
        this.autoConnect = false
        if (this.socketTask) {
            try {
                this.socketTask.close()
            } catch (e) {
                console.log(e)
            }
        }
    }
}

export {WxStompClient}
