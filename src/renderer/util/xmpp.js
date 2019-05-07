// import { resolve } from "_uri-js@4.2.2@uri-js";
// import { reject } from "_@types_q@1.5.2@@types/q";

// import store from '../store/index.js';
import showGreeting from './xmppMessage';
/**************** xmpp连接 开始 ****************/
let XMPPData = {};

//是否是被别人踢掉的
let isKicked = false;
//主动断开xmpp连接
let initiativeLeave = false;
let timer = null;
let isJoinRoom = false;

let _this = '';
export const xmpp = {
    createData(data, roomNum, isJoinRoom) {
        _this = this;
        console.log('xmppCookieData=====',data)
        XMPPData = {
            conferences: {
                xmppUsername: data.xmppUsername,
                xmppPassword: data.xmppPassword,
                webrtcXmppIp: data.webrtcXmppIp,
                xmppServer: data.xmppServer
            },
            reConnectFlag: false,
            // XMPP服务器BOSH地址
            BOSH_SERVICE: data.webrtcXmppIp + '/http-bind/',
            // 房间JID 1085911
            ROOM_JID: '',
            // XMPP连接
            connection: null,
            // 当前状态是否连接
            connected: false,
            // 当前登录的JID
            jid: data.xmppUsername + '@' + data.xmppServer
        };

        _this.init(roomNum, isJoinRoom);
    },
    init(roomNum, isJoin) {
        console.log('xmppInit方法被调用');
        XMPPData.ROOM_JID = `${roomNum}@conference.127.0.0.1`;
        isJoinRoom = isJoin;
        _this.loginConnect();
    },
    
    // 连接状态改变的事件
    onConnect(status) {
        if (status == Strophe.Status.AUTHFAIL) {
            console.log(`${status}=>`, '登录失败！');
        } else if (status == Strophe.Status.CONNTIMEOUT) {
            console.log(`${status}=>`, '连接超时！');
        } else if (status == Strophe.Status.CONNFAIL) {
            console.log(`${status}=>`, '连接失败！');
        } else if (status == Strophe.Status.AUTHFAIL) {
            console.log(`${status}=>`, '登录失败！');
        } else if (status == Strophe.Status.DISCONNECTING) {
            console.log(`${status}=>`, '连接正在关闭！');
            XMPPData.connected = false;
        } else if (status == Strophe.Status.ERROR) {
            console.log(`${status}=>`, '连接错误！');
            XMPPData.connected = false;
        } else if (status == Strophe.Status.DISCONNECTED) {
            console.log(`${status}=>`, '连接断开！');
            XMPPData.connected = false;
            initiativeLeave = true; //主动断开xmpp连接
            // this.i == 0 &&
            isKicked = false
            if (!isKicked) {
                _this.reConnect();
            }
            // this.i++;
        } else if (status == Strophe.Status.CONNECTING) {
            console.log(`${status}=>`, '正在连接！');
            XMPPData.connected = false;
        } else if (status == Strophe.Status.CONNECTED) {
            console.log(`${status}=>`, '连接成功，可以开始聊天了！');
            clearInterval(timer);
	    	timer=null;
            XMPPData.connected = true;
            initiativeLeave = false;
            // 当接收到<message>节，调用onMessage回调函数
            XMPPData.connection.addHandler(_this.onMessage, null, 'message', null, null, null);
            if (XMPPData.reConnectFlag) {
                setTimeout(() => {
                    XMPPData.connection.addHandler(_this.onStream, null, 'stream:error', null, null, null);
                }, 60000);
                // self.getParticipantsFn();
            } else {
                XMPPData.connection.addHandler(_this.onStream, null, 'stream:error', null, null, null);
            }

            // 首先要发送一个<presence>给服务器（initial presence）
            XMPPData.connection.sendPresence($pres().tree());
            if(isJoinRoom) {
                XMPPData.connection.sendPresence($pres({
                    from: XMPPData.jid,
                    to: XMPPData.ROOM_JID + "/" + XMPPData.jid.substring(0, XMPPData.jid.indexOf("@"))
                }).c('x',{xmlns: 'jabber:client'}).tree());
            }
            // 发送在线状态
            XMPPData.connection.sendPresence($pres({
                from: XMPPData.jid,
            }).c('status', '2').tree());
            XMPPData.connection.send($pres().c('priority').t('1'));
        }
    },

    // 接收到<message>
    onMessage(msg) {
        console.log(msg);
        // 解析出<message>的from、type属性，以及body子元素
        let _from = msg.getAttribute('from');// 消息来源
	    let type = msg.getAttribute('type');// 消息类型 groupchat:群消息，chat:个人消息
	    let elems = msg.getElementsByTagName('body');// 消息内容
		let elemsSubject = msg.getElementsByTagName('subject');// 消息主题 例：'5000|2'
        let body = elems[0];
        if (elems.length > 0 && body.innerHTML) {
            let userData = _from.substring(_from.indexOf("/")+1);
            let userArr = userData.split("-");
            let bodyJson = JSON.parse(body.innerHTML);//body内容 字符串转对象

            // 聊天消息拼接
            let chatMsgObj = {
                "userId": userArr[0],
                "realName": userArr[1],
                "content": bodyJson.msgData,
                "chatType": type
            };
            /*
            * 判断是否存在subject
            * 白板消息（4000）；聊天消息（5000）
            */
           let subject = elemsSubject[0];
            if(elemsSubject.length > 0){
                let subjectArr = subject.innerHTML.split("|");
                chatMsgObj.msgType =  subjectArr[0];
                chatMsgObj.roomType = subjectArr[1];

                if(subjectArr[0]=="4000" && userArr[0]!=self.userId){//白板消息内容
                    _this._showGreeting(JSON.parse(body.innerHTML));
                }else{ // 公共聊天消息内容
                    _this._showGreeting(chatMsgObj);
                }
            }else if(type == "chat"){ //私聊消息内容
                chatMsgObj.msgType =  bodyJson.msgType;
                // chatMsgObj.userId = self.userId;
                // chatMsgObj.realName = self.realName;
                chatMsgObj.toRealName = bodyJson.fromName;
                chatMsgObj.toUserId = bodyJson.fromUserId;
                chatMsgObj.fromRealName = chatMsgObj.realName = bodyJson.fromName;
                chatMsgObj.fromUserId = chatMsgObj.userId = bodyJson.fromUserId;

                _this._showGreeting(chatMsgObj);
            }else{ //其他消息
                _this._showGreeting(JSON.parse(body.innerHTML));
            }
        }
        return true;
    },
    onStream(msg) {
        console.log('xmpp isKicked', msg);
        isKicked = true;
    },
    // 通过BOSH连接XMPP服务器
    loginConnect() {
        if (!XMPPData.connected) {
            XMPPData.connection = new Strophe.Connection(XMPPData.BOSH_SERVICE);
            XMPPData.connection.connect(XMPPData.conferences.xmppUsername + '@' + XMPPData.conferences.xmppServer + '/webrtc', XMPPData.conferences.xmppPassword, _this.onConnect);
            XMPPData.jid = XMPPData.conferences.xmppUsername + '@' + XMPPData.conferences.xmppServer;
        } else {
            clearInterval(timer);
	    	timer = null;
        }
    },
    _showGreeting(msg) {
        showGreeting(msg)
    },
    //重连
    reConnect() {
        XMPPData.reConnectFlag = true;
        // console.log(1)
        timer = setInterval(function () {
            if (!XMPPData.connected) {
                _this.loginConnect();
                if (XMPPData.connected) {
                    console.log('重连成功');
                    console.log(timer)
                    clearInterval(timer);
                    timer = null;
                    console.log(timer)
                    return;
                }
            }
        }, 15000);
    },
    // 断开xmpp连接
    disConnectXmpp(){
        // this.isKicked = true;
        if (XMPPData.connected) {
            XMPPData.connection.disconnect();
        }
    }
}