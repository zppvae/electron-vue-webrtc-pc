
/**
 * 监听xmpp消息返回
 * 
 */
import {conferenceApi} from '../server/api'
import store from '../store/index';
import { Message } from 'element-ui';
import { Hint } from '../config/messagebox';

let meetingData = {};
let allParticipants = [];
let userData = {};
function showGreeting(msg) {
  console.log("xmppMessage====", msg);
  getConference();
  getConferenceUser();
  const msgData = msg.msgData;
  const msgType = msg.msgType;

  switch (msgType) {
    case 1001: // 会议开始
      meetingData.cid = msgData.cid;
      break;
    case 1002: // 会议结束
      break;
    case 2001: // 参会者进入 
      Hint(`${msgData.displayName}加入会议`)
      getParticipants();
      break;
    case 2002: // 参会者主动离开
    case 2003: //参会者被挂断
      if(msgData.userId != userData.userId){
        allParticipants.forEach(list => {
          if(msgData.userId === list.userId){
            Hint(`${list.displayName}离开会议`)
          }
        });
        getParticipants();
      }
      break;
    case 2004: //参会者身份发生变化
    case 2005: //参会者被静音
    case 2006: //参会者被取消静音
    case 2007: //参会者信息改变
      getParticipants();
      break;
    case 2008: //收到参会者举手消息
      if(msgData.userId != userData.userId) {
        Hint(`${msgData.displayName}发起举手`)
      }
      getParticipants();
      break;
    case 3012: 
    case 3013: // 状态改变
      getParticipants();
      break;
    case 3014: // 全部静音改变
      break;
    case 3008:  //多终端登录  后登录的人会踢掉前一个人
      Hint(`您的账号在其他设备登录，如非本人操作，则密码可能已泄露，请尽快修改密码`, 'error')
      break;  
    case 3006:  //用户账号被冻结
      Hint(`用户账号被冻结`, 'error')
      break;
    case 3007:  //用户账号被删除
      Hint(`用户账号被删除`, 'error')
      break;
    case 3011:  //企业被冻结
      Hint(`企业被冻结`, 'error')
      break;
    case 3019:  //收藏/取消收藏
      break;
    case "5000":  //聊天消息
      break;
    case 6000:  //私聊消息
      break;
    case 4000:  //绘制白板消息
      break;
    case 3024:  //发起白板消息
      break;
    case 3025:  //结束白板消息
      break;
    case 3026:  //发起投票消息
      break; 
    case 3030: //投票结束
      break;
    case 2009: //被动取消举手消息
    case 3027: //主动取消举手消息
      Hint(`${msgData.displayName}取消举手`)
      getParticipants();
      break; 
    case 3033: //uc退出登录 webrtc执行退出会议
      break; 
    case 3034: //发起双流消息
      break; 
    case 3035: //结束双流消息
      break;
    default:
      break;
  }
}
function getConference() {
  const _conferences = store.getters.getConferenceData;
  meetingData = _conferences.conference;
}
function getConferenceUser() {
  const _userdata = store.getters.getConferenceRoleData;
  userData = _userdata;
}
function getParticipants() {
  console.log("xmppMessage getParticipants ====", meetingData);
  // 获取参会者列表
  conferenceApi.getParticipants(meetingData.cid, meetingData.vmrNumber)
  .then(reslist => {
    allParticipants = reslist.list;
    store.dispatch('asyncParticipantsData', reslist.list);
  })
}

 export default showGreeting;