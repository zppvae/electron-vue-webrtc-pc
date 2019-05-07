
import axios from 'axios';
import { environment } from '../config/environment';
import { tokenService } from '../util/tokenService';
import store from '../store/index.js';
// 环境的切换

// (store.state.serverAddress || process.env.VUE_APP_BASE_URL)
axios.defaults.baseURL = environment.apiBase + '/appapi';


// 请求超时
axios.defaults.timeout = 10000;

// 请求拦截
axios.interceptors.request.use(function (config) {
  
  // config.baseURL = store.getters.getServerAddress + '/appapi';
  config.headers.terminalType = 'web';
  config.headers.Authorization = tokenService.getToken();

  return config;
}, function (error) {
  return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
  // 对响应数据做处理
  return response;
}, function (error) {
  const _response = error.response;
  switch (_response.status) {
      case 401:
          console.log('token无效');
            tokenService.refreshToken(); // 刷新token
          break;
      case 413:
          console.log('token已过期');
            tokenService.refreshToken(); // 刷新token
          break;
      case 500:
          console.log('服务器错误');
          break;
      case 404:
          console.log('找不到api');
          break;
      case 402:
          console.log('服务器异常');
          break;
      default:
          // console.log(_response.data.msg)
          break;
  }
  // 对响应错误做处理
  // 4016 - 服务器内部错误
  if(_response.data.code != 4016) {
    return Promise.reject(_response.data);
  }
});

/**
 * 封装get方法
 * @param url
 * @param data
 * @returns {Promise}
 */

export function get(url,params={}){
  return new Promise((resolve,reject) => {
    axios.get(url, {
      params: params
    })
    .then(response => {
      resolve(response.data);
    })
    .catch(err => {
      reject(err)
    })
  })
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function post(url, data = {}) {
  return new Promise((resolve,reject) => {
    axios.post(url, data)
      .then(response => {
        resolve(response.data);
      },err => {
        reject(err)
      })
  })
}

 /**
 * 封装delete请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function _delete(url,params = {}) {
  return new Promise((resolve,reject) => {
    axios.delete(url, {
      params: params
    })
    .then(response => {
      resolve(response.data);
    })
    .catch(err => {
      reject(err)
    })
  })
}
 /**
 * 封装patch请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function patch(url, data = {}){
  return new Promise((resolve,reject) => {
    axios.patch(url, data)
      .then(response => {
        resolve(response.data);
      },err => {
        reject(err)
      })
  })
}

 /**
 * 封装put请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function put(url,data = {}){
  return new Promise((resolve,reject) => {
    axios.put(url,data)
      .then(response => {
        resolve(response.data);
      },err => {
        reject(err)
      })
  })
}