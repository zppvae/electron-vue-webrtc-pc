
import Vue from 'vue'
import Vuex from 'vuex'
import { xmpp } from '../util/xmpp.js'
import devicesInfo from './modules/devicesInfo'
import { environment } from '../config/environment';
Vue.use(Vuex);


//要设置的全局访问的state对象
const state={
  // 登录状态
  isLoggedIn: $cookies.isKey('uc_isLogin') && $cookies.isKey('uc_access_token'),
  // 登录用户的信息
  loginData: JSON.parse(localStorage.getItem('uc_loginData')),
  // xmpp账号信息
  xmppCookieData: $cookies.get('xmppCookieData'),
  // 服务地址
  serverAddress: environment.apiBase, //process.env.VUE_APP_BASE_URL, // 'https://pre.svocloud.com',
  // 呼叫速率
  resolution: '256',
  
  localVolume: 1,
  // 会议信息
  conferences: {},
  // 会议权限
  conferenceRole: {},
  // 参会者
  participants: [],
  // 右侧侧边栏是否显示 默认显示 true
  sideBarState: true
};
//实时监听state值的变化(最新状态)
const getters = {
  xmppInit(state){
    if(state.loginData){
      xmpp.createData(state.xmppCookieData, state.conferences.conference.vmrNumber, true);
    }else{
      xmpp.disConnectXmpp();
    }
  },
  getIsLoggedIn(state) {  //承载变化的isLoggedIn的值
    return state.isLoggedIn
  },
  getLoginData(state) {
      return state.loginData;
  },
  getServerAddress(state) {
    return state.serverAddress;
  },
  getConferenceData(state) {
    return state.conferences;
  },
  getConferenceRoleData(state) {
    return state.conferenceRole;
  },
  getParticipantsData(state) {
    return state.participants;
  },
  
  getLocalVolume(state) {
    return state.localVolume;
  },
  getResolution(state) {
    return state.resolution;
  },
  getSideBarState(state) {
    return state.sideBarState;
  }
};
// 同步事务
//改变state初始值的方法，这里面的参数除了state之外还可以再传额外的参数(变量或对象);
const mutations = {
  setIsLoggedIn(state,status) {
    state.isLoggedIn = status;
  },
  setLoginData(state,userData){
    state.loginData = userData;
    // console.log('loginData ======',state.loginData)
  },
  // 监听设置xmpp账号信息
  setXmppData(state, data){
    state.xmppCookieData = data;
  },
  // 监听设置服务地址
  setServerAddress(state, value) {
    state.serverAddress = value;
  },
  // 监听设置呼叫速率
  setResolution(state, value) {
    state.resolution = value;
  },
  
  setLocalVolume(state, value) {
    state.localVolume = value;
  },
  // 监听设置会议信息
  setConferencesData(state, data) {
    state.conferences = data;
  },
  setConferenceRoleData(state, data) {
    state.conferenceRole = data;
  },
  setParticipantsData(state, data) {
    state.participants = data;
  },
  setSideBarState(state, value) {
    state.sideBarState = value;
  }
};
// 异步事务
// 自定义触发mutations里函数的方法，context与store 实例具有相同方法和属性
const actions = {
  // 异步更改登录数据
  asyncLoginData(context, userData) {
    context.commit('setLoginData', userData);
  },
  asyncXmppData(context, data) {
    context.commit('setXmppData', data);
  },
  
  asyncConferenceData(context, data) {
    context.commit('setConferencesData', data);
  },
  asyncConferenceRoleData(context, data) {
    context.commit('setConferenceRoleData', data);
  },
  asyncParticipantsData(context, data) {
    context.commit('setParticipantsData', data);
  }
};


const store = new Vuex.Store({
    modules: {
      devicesInfo
    },
    state,
    getters,
    mutations,
    actions
 });

export default store;