'use strict';
/**
 * webrtc 浏览器支持性判断
 * created by lixd
 * 2019/01/11
 */

var prefix; // 浏览器前缀
var version; // 浏览器版本

if (window.mozRTCPeerConnection || navigator.mozGetUserMedia) {
  prefix = 'moz';
  version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
} else if (window.webkitRTCPeerConnection || navigator.webkitGetUserMedia) {
  prefix = 'webkit';
  version = navigator.userAgent.match(/Chrom(e|ium)/) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
}

var PC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var MediaStream = window.webkitMediaStream || window.MediaStream;
var screenSharing = window.location.protocol === 'https:' &&
    ((prefix === 'webkit' && version >= 26) ||
     (prefix === 'moz' && version >= 33))
var AudioContext = window.AudioContext || window.webkitAudioContext;
var videoEl = document.createElement('video');
var supportVp8 = videoEl && videoEl.canPlayType && videoEl.canPlayType('video/webm; codecs="vp8", vorbis') === "probably";
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || navigator.mozGetUserMedia;

var hasWebRTC = navigator.msLaunchUri ? false : navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || false;
var chrome_ver,firefox_ver,edge_ver,safari_ver;
if (navigator.userAgent.indexOf("Chrome") != -1) {
  chrome_ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
} else {
  chrome_ver = 0;
}

if (navigator.userAgent.indexOf("Firefox") != -1) {
  firefox_ver = parseInt(window.navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);
} else {
  firefox_ver = 0;
}
if (navigator.userAgent.indexOf("Edge") != -1) {
  edge_ver = parseInt(window.navigator.userAgent.match(/Edge\/\d+\.(\d+)/)[1], 10);
  chrome_ver = 0;
} else {
  edge_ver = 0;
}

if (chrome_ver == 0 && edge_ver == 0 && navigator.userAgent.indexOf("Safari") != -1) {
  safari_ver = parseInt(window.navigator.appVersion.match(/Safari\/(\d+)\./)[1], 10);
} else {
  safari_ver = 0;
}
var browserVersion = {
  'chrome_ver': chrome_ver,
  'firefox_ver': firefox_ver,
  'edge_ver': edge_ver,
  'safari_ver': safari_ver
};

var support = {
  prefix: prefix,
  version: version,
  browserVersion: browserVersion,
  support: !!PC && !!getUserMedia,
  // new support style
  supportRTCPeerConnection: !!PC,
  supportVp8: supportVp8,
  supportGetUserMedia: !!getUserMedia,
  supportDataChannel: !!(PC && PC.prototype && PC.prototype.createDataChannel),
  supportWebAudio: !!(AudioContext && AudioContext.prototype.createMediaStreamSource),
  supportMediaStream: !!(MediaStream && MediaStream.prototype.removeTrack),
  supportScreenSharing: !!screenSharing,
  // constructors
  AudioContext: AudioContext,
  PeerConnection: PC,
  SessionDescription: SessionDescription,
  IceCandidate: IceCandidate,
  MediaStream: MediaStream,
  getUserMedia: getUserMedia,
  supportWebRTC: hasWebRTC
}

export default support