// import axios from 'axios';
import store from '../store/index.js';
import { common } from "../util/common.js";
import Cookie from "../util/elcookie";
import { post, get, patch, put, _delete } from './axios';


export const conferenceApi = {
   $post: post,
   $get: get,
   $patch: patch,
   $put: put,
   $_delete: _delete,
  /** 
     * 匿名用户入会逻辑处理 
     * 1. 接口获取gwtoken {/uc/toWebRTCIndex/noAuthorized}
     *  返回创建的匿名账号信息，保存到cookie中
     * 2. 登录获取token
     * 3. 加入会议
    */
   getJwtTokenNo(realName) {
     return new Promise((resolve, reject) => {
      const postdata = {realName: realName};
      this.$post(`/uc/toWebRTCIndex/noAuthorized`, postdata)
      .then(res => {
        let {code, data } = res;
        if(code === 200) {
          // 存cookie
          // common.loginSetData(data);
          // $cookies.set('webRtcAddress', data.webRtcAddress, data.expires_in);
          // $cookies.set('JwtToken', data.jwtToken, data.expires_in);
          // $cookies.set('uc_access_token', data.access_token, data.expires_in);
          // $cookies.set('uc_refresh_token', data.refresh_token, data.expires_in);
          // $cookies.set('uc_expires_in', data.expires_in, data.expires_in);

          Cookie.setCookie('webRtcAddress', data.webRtcAddress, data.expires_in);
          Cookie.setCookie('JwtToken', data.jwtToken, data.expires_in);
          Cookie.setCookie('uc_access_token', data.access_token, data.expires_in);
          Cookie.setCookie('uc_refresh_token', data.refresh_token, data.expires_in);
          Cookie.setCookie('uc_expires_in', data.expires_in, data.expires_in);
          
          localStorage.setItem("uc_loginData", JSON.stringify(data));

          resolve(data)
        }
      })
      .catch(error => {
        reject(error)
      })
     })
    
  },
  // 匿名用户 登录获取token
  anonymousToken() {
    this.$get(`/uc/requestToken`)
    .then(res => {
      let {code, data} = res;
      if(code === 200) {
        $cookies.set('uc_access_token', data.access_token, data.expires_in);
      }
    })
  },
  //匿名登录加入会议
  anonymousLogin(roomNum, pin, realName) {
    return new Promise((resolve, reject) => {
      const postData = {"roomNumber": roomNum, "password": pin, "realName": realName};
      this.$post(`/uc/conferences/join/anonymous`, postData)
      .then(res => {
        let {code, data} = res;
        if(code === 200) {
          resolve(data);
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },
/*************************** /匿名用户 登录／入会 **********************/

/*************************** 正常入会接口 **********************/
  //获取turn_server
  getTurnServer() {
    this.$get(`/uc/turnServer`)
    .then(res => {
      let {code, data} = res;
      if(code === 200) {
        $cookies.set('turnServer', data);
      }
    })
    .catch(error => {
      reject(error)
    })
  },
  getJwtToken() {
    return new Promise((resolve, reject) => {
      this.$get(`/uc/toWebRTCIndex`)
      .then(res => {
        let {data} = res;
        $cookies.set('webRtcAddress', data.webRtcAddress);
        $cookies.set('JwtToken', data.JwtToken);
        resolve(data)
      })
      .catch(error => {
        reject(error)
      })
    })
  },
  // 已经登录的用户加入会议

  join(roomNumber, password, entId, source) {
    return new Promise((resolve, reject)=>{
      const postdata = {'roomNumber':roomNumber, 'password':password, source:source, entId: entId};
      this.$post(`/uc/conferences/join`, postdata)
      .then(res => {
        // cb(res);
        let {code, data} = res;
        if(code === 200){
          resolve(data)
        }else{
          reject(error)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
    
  },
  

  // 判读会议是否有密码
  existPassword(roomNumber) {
    return new Promise((resolve, reject) => {
      this.$get(`/uc/rooms/${roomNumber}/existPassword`)
      .then(res => {
        let {code, data } = res;
        if(code === 200) {
          resolve(data);
        }
      })
      .catch(error => {
        reject(error)
      })
    })
    
  },

  // 获取会议信息
  conferenceInfo(cid) {
    return new Promise((resolve, reject)=>{
      this.$get(`/uc/conferences/starting/${cid}`)
      .then(res => {
        const {code, data} = res;
        if(code === 200) {
          resolve(data)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },
  // 获取参会者
  getParticipants(cid, roomNum) {
    return new Promise((resolve, reject) => {
      this.$get(`/uc/conferences/${cid}/participant/${roomNum}`)
      .then(res => {
        const {code, data} = res;
        if(code === 200) {
          resolve(data)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },
  // 静音/解除静音单个参会者
  setParticipantMute(cid, userId, type) {
    return new Promise((resolve, reject) => {
      const postdata = {"mute": type};
      this.$post(`/uc/conferences/${cid}/mute/${userId}`, postdata)
      .then(res => {
        const {code, data, msg} = res;
        if(code === 200) {
          resolve(data)
        }else{
          reject(msg)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },

  // 参会者身份切换
  setRole(cid, user) {
    return new Promise((resolve, reject) => {
      let puuid = user.puuid;
      let postdata; //身份类型：host-4001,visitor-4002
      if(user.role == 4001){
        postdata = {"hostrole": "4002"};
      }else{
        postdata = {"hostrole": "4001"};
      }
      this.$post(`/uc/conferences/${cid}/convert/${puuid}`, postdata)
      .then(res => {
        const {code, data, msg} = res;
        if(code === 200) {
          resolve(data)
        }else{
          reject(msg)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },
  // 呼叫单个参会者
  dialUsers(cid, userId){
    return new Promise((resolve, reject) => {
      this.$post(`/uc/conferences/${cid}/dial/${userId}`, '')
      .then(res => {
        const {code, data, msg} = res;
        if(code === 200) {
          resolve(data)
        }else{
          reject(msg)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },
  // 挂断单个参会者
  participantDisconnect(cid, puuid) {
    return new Promise((resolve, reject) => {
      this.$post(`/uc/conferences/${cid}/disconnect/${puuid}`, '')
      .then(res => {
        const {code, data, msg} = res;
        if(code === 200) {
          resolve(data)
        }else{
          reject(msg)
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  },

  // 结束会议
  closeConference(cid) {
    return new Promise((resolve, reject) => {
      this.$post(`/uc/conferences/${cid}/stop`, '')
      .then(res =>{
        let {code, data, msg} = res;
        if(code === 200){
          resolve(data)
        }else{
          reject(msg);
        }
      })
      .catch(error => {
        reject(error)
      })
    })
  }

}