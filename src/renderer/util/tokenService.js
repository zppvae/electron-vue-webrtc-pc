import axios from 'axios';
import store from '../store/index.js';

import {common} from './common.js';
import { environment } from '../config/environment';
// let apiBase = (sessionStorage.getItem('baseUrl') || environment.apiBase) + '/appapi';
let apiBase = process.env.VUE_APP_BASE_URL + '/appapi';

let allCookies;
export const tokenService = {
    //获得token
    getToken() {
        const locAccessToken = common.getLocstorage('uc_access_token') //allCookies['uc_access_token']; //$cookies.get('uc_access_token');
        return 'Bearer ' + locAccessToken;
    },

    // 刷新access_token
    refreshToken() {
        allCookies = common.getLocstorage('uc_loginData')//store.getters('userCookies/getAllCookies');
        const tokenData = 'grant_type=refresh_token&scope=web&client_id=2513608755203&client_secret=32b42c8d694d520d3e321&refresh_token=' + allCookies['refresh_token'];//$cookies.get('uc_refresh_token');
        // const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });

        return axios.post(apiBase + '/oauth/token', tokenData)
            .then(response => {
                const { data } = response;
                // $cookies.set('uc_access_token', data.access_token, data.expires_in);
                // $cookies.set('uc_refresh_token', data.refresh_token, data.expires_in);
                // $cookies.set('uc_expires_in', data.expires_in, data.expires_in);
                // $cookies.set('uc_isLogin', 'true', data.expires_in);
                const _data = [
                    {'name': 'uc_access_token', 'value': data.access_token},
                    {'name': 'uc_refresh_token', 'value': data.refresh_token},
                    {'name': 'uc_expires_in', 'value': data.expires_in},
                    {'name': 'uc_isLogin', 'value': true},
                ]
                _data.forEach((item)=>{
                    store.dispatch('userCookies/asynSetCookies', item)
                })
                common.setLocstorage('uc_isLogin', true)
                common.setLocstorage('uc_access_token', data.access_token)
            })
            .catch(err => {
                // console.log(err)
                const errData = err;
                if (+err.status === 401) {
                    // 清除cookies，localStorage，并返回登录
                }
            });
    }
}
