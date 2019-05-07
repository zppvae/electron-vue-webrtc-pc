/**
 * 自定义过滤器
 */
import Vue from 'vue'

/** 
 * 字符串截取
 * 定义：limitTo(start,length)表示从start位置开始，截取length长度的字符串。
 * start 为空时 默认从第0位开始
 * length 为空时 默认截取长度为1位
 */
Vue.filter('limitTo', (value, start, length) => {
  let _string = value,
  _start = (typeof start === 'undefined') ? 0 : start,
  _length = (typeof length === 'undefined') ? 1 : length;
  return _string.substr(_start, _length);
});

/**
 * 保留2位小数
 * 例如：2，会在2后面补上00.即2.00
 */
Vue.filter('toDecimal2', x => {
  var f = parseFloat(x);
  if (isNaN(f)) {
    return false;
  }
  var f = Math.round(x * 100) / 100;
  var s = f.toString();
  var rs = s.indexOf('.');
  if (rs < 0) {
    rs = s.length;
    s += '.';
  }
  while (s.length <= rs + 2) {
    s += '0';
  }
  return s;
});
/**
 * 将视频流信息中的英文转换为中文 
 * */
const CALL_INFO = {
  "incoming": "呼入",
  "outgoing": "呼出",
  "audio": "音频",
  "video": "视频",
  "bitrate": "比特率",
  "codec": "编解码",
  "packets-lost": "丢失包",
  "packets_lost": "丢失包",
  "packets-received": "接收包",
  "packets-sent": "发送包",
  "percentage-lost": "丢包率",
  "percentage-lost-recent": "最近丢失百分比",
  "decode-delay": "解码延迟",
  "resolution": "分辨率",
  "configured-bitrate": "已设置的比特率",
  "buffer_length": "缓冲区长度",
  "latency": "延迟率",
  "packet_loss": "丢包",
  "dropped_frames": "抛弃帧",
  "framerate": "帧率",
  "level": "等级",
  "encrypted": "已加密",
}
Vue.filter('translateStatic', name => {
  return CALL_INFO[name];
})