// cookie.js

// 通过remote模块取的原本在主进程中才能使用的session模块
 
import { remote } from 'electron'
import store from '../store/index'

/**
 * 获得
 */
let maindatas = remote.getGlobal('sharedObject')
console.log('sharedObject======',maindatas)
let Session  = remote.session;
const Cookie = {}
// const Session = Electron.remote.session
Cookie.getCookies = (name) => {
    let data = []
    return new Promise(function (resolve, reject) {
        Session.defaultSession.cookies.get({ name:name}, function (error, cookies) {
            console.log('cookies', cookies);
            if (cookies.length > 0) {
                data = cookies
            }
            resolve(cookies)
        })
    })

};
/**
 * 清空缓存
 */
Cookie.clearCookies = () => {
    Session.defaultSession.clearStorageData({
        origin: store.getters.getServerAddress,
        storages: ['cookies']
    }, function (error) {
        if (error) console.error(error);
    })
};

/**
 * 保存cookie
 * @param name  cookie名称
 * @param value cookie值
 */
Cookie.setCookie = (name, value, date) => {
    let Days = 30;
    let exp = new Date();
    let _date = Math.round(exp.getTime() / 1000) + Days * 24 * 60 * 60;
    const cookie = {
        url: maindatas.mainurl, // 'http://localhost:9080',//store.getters.getServerAddress,
        name: name,
        value: value,
        expirationDate: date || _date
    };
    Session.defaultSession.cookies.set(cookie, (error) => {
        if (error) console.error(error);
    });
    Session.defaultSession.cookies.flushStore(()=>{});

    console.log(maindatas.mainurl, name, value, date)
    Cookie.getAllCookies().then(data=>{
        console.log(data)
    }).catch(err=>{
        console.error(err)
    })
};

Cookie.getAllCookies = () => {
    let data = [];
    return new Promise(function (resolve, reject) {
        Session.defaultSession.cookies.get({url: maindatas.mainurl}, function (error, cookies) {
            console.log('allCookies', cookies);
            if (cookies.length > 0) {
                data = cookies
            }
            resolve(cookies)
        })
    })
};
export default Cookie
// module.exports = Cookie