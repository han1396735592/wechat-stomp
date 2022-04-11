import {WxStompClient} from "./wxStompClient";

const wxStompClient = new WxStompClient()

let StompBehavior = Behavior({
    behaviors: [],
    attached: function () {
        let that = this
        that.setData({
            _wxStompClient: wxStompClient,
            _stompConnected: wxStompClient.connected,
            stomp_map: new Map()
        })
        wxStompClient.addEventListener("socket-close", that.__stompSocketCloseEventListener)
        wxStompClient.addEventListener("stomp-connected", that.__stompConnectedEventListener)
    },
    detached() {
        let that = this
        wxStompClient.removeEventListener("socket-close", that.__stompSocketCloseEventListener)
        wxStompClient.removeEventListener("stomp-connected", that.__stompConnectedEventListener)
        let stomp_map = this.data.stomp_map
        for (let [topic, topicValue] of stomp_map) {
            topicValue.unsubscribe()
            console.debug('取消订阅[' + topic + ']====>' + topicValue.id)
        }
        console.groupEnd()
        stomp_map.clear()
    },
    data: {},
    methods: {
        __stompSocketCloseEventListener() {
            this.setData({
                _stompConnected: false
            })
            console.debug("__stompSocketCloseEventListener")
        },
        __stompConnectedEventListener() {
            this.setData({
                _stompConnected: true
            })
            console.debug('__stompConnectedEventListener')
            for (let [topic, topicValue] of new Map(this.data.stomp_map)) {
                if (topicValue.callback) {
                    console.debug("重新订阅" + topic)
                    this._stompSubscribe(topic, topicValue.callback)
                }
            }
        },
        _stompUnsubscribe(destination) {
            let that = this
            if (that.data.stomp_map.has(destination)) {
                let obj = that.data.stomp_map.get(destination)
                obj.unsubscribe && obj.unsubscribe()
                console.debug('取消订阅[' + destination + ']====>' + obj.id)
                that.data.stomp_map.delete(destination)
            }
        },
        _stompSubscribe(destination, callback) {
            let that = this
            if (wxStompClient.connected) {
                that._stompUnsubscribe(destination)
                console.debug('订阅-----------------------[' + destination + ']')
                that.data.stomp_map.set(destination, Object.assign(wxStompClient.stompClient.subscribe(destination, (fragment) => {
                    // console.debug('frame = ', fragment)
                    callback(fragment)
                }), {
                    callback: callback
                }))
            } else {
                setTimeout(() => {
                    that._stompSubscribe(destination, callback)
                }, 15000)
            }
            console.groupEnd()
        },
        _stompSend() {
            if (wxStompClient.connected) {
                return wxStompClient.stompClient.send(...arguments)
            } else {
                return Promise.reject("stomp not connected")
            }
        }
    }
})

export {
    StompBehavior, wxStompClient
}
