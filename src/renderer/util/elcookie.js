// cookie.js

// 通过remote模块取的原本在主进程中才能使用的session模块

/**
 * 获得
 */
const Cookie = {}
const Session = Electron.remote.session
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
Cookie.clearCookies = (url) => {
    Session.defaultSession.clearStorageData({
        origin: url,
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
        url: "",
        name: name,
        value: value,
        expirationDate: date || _date
    };
    Session.defaultSession.cookies.set(cookie, (error) => {
        if (error) console.error(error);
    });
};

export default Cookie
// module.exports = Cookie