/**
 * userCookie.js
 * 用户登录后的数据
 * token等
 */

const state = {
  'uc_access_token': '',
  'uc_expires_in': '',
  'uc_token_type': '',
  'uc_refresh_token': '',
  'uc_realName': '',
  'uc_isLogin': false,
  'webRtcAddress': '',
  'JwtToken': '',
  'turnServer': ''
}

const getters = {
  getValueByName: (state) => (name) => {
    return state.find(todo => todo.key === name)
  },
  getAllCookies(state) {
    return state
  }
}
const mutations = {
  setCookies(state, data){
    state[data.name] = data.value;
    // console.log('usercookies----', state)
  }
}

const actions = {
  asynSetCookies(context, data) {
    context.commit('setCookies', data);
  }
}

export default {
  namespaced: true, // 用于在全局引用此文件里的方法时标识这一个的文件名
  state,
  getters,
  mutations,
  actions
}
