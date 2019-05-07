/**
 * devicesInfo.js
 * 媒体设备
 */
const state = {
  // 当前设备所有的音频/视频设备列表
  devicesInfoList: {},
  // 已经选中音频/视频的 deviceId
  devicesInfo: {
    // 视频设备id
    videoSource: '',
    // 音频设备id
    audioSource: '',
    audioOutput: ''
  }
};

const getters = {
  getDevicesInfoList(state) {
    return state.devicesInfoList;
  },
  getDevices(state) {
    return state.devicesInfo;
  }
};

const mutations = {
  // 监听设置音视频设备id
  setDevicesInfoList(state, list) {
    state.devicesInfoList = list;
  },
  setDevices(state, device){
    state.devicesInfo[device.name] = device.value;
    // console.log("setDevices------",state.devicesInfo)
  }
};

const actions = {
  asynDevicesInfoList(context,data) {
    context.commit('setDevicesInfoList', data);
  }
}

export default {
  namespaced: true, // 用于在全局引用此文件里的方法时标识这一个的文件名
  state,
  getters,
  mutations,
  actions
}
