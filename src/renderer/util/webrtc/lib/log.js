    
    let __isDebug__ = true;
    /** 输出红色日志 */
    function e() {
      if (__isDebug__ && arguments.length > 0) {
        let arr = Array.prototype.slice.call(arguments);
        __log("E", 'red', arr);
      }
    };
    /** 输出黄色日志 */
    function w() {
      if (__isDebug__ && arguments.length > 0) {
        let arr = Array.prototype.slice.call(arguments);
        __log("W", '#FFA500', arr);
      }
    };

    /** 输出绿色日志 */
    function i() {
      if (__isDebug__ && arguments.length > 0) {
        let arr = Array.prototype.slice.call(arguments);
        __log("I", '#00FF00', arr);
      }
    };
    /** 输出黑色正常日志 */
    function d() {
      if (__isDebug__ && arguments.length > 0) {
        let arr = Array.prototype.slice.call(arguments);
        __log("D", '#000000', arr);
      }
    };
    /**
    * @param tagStr 没有标签时默认显示的
    * @param color 日志颜色
    * @param arr 日志参数
    */
    function __log(tagStr, color, arr) {
      let tag = arr[0];
      if (typeof (tag) == "string" || tag == null || tag == undefined) {
        arr[0] = `%c ${arr[0]}`;
        arr.splice(1, 0, `color:${color}`);
      } else {
        arr.splice(0, 0, `%c ${tagStr} : `);
        arr.splice(1, 0, `color:${color}`);
      }
      console.log.apply(console, arr);
    }

    export default {
      debug: d,
      info: i,
      warn: w,
      error: e
    }
