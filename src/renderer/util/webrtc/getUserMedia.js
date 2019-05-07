'use strict';
/**
 * 获取本地摄像头媒体流
 * @param {*} constrains 
 */
function getUserMedia(constrains) {
  return new Promise((resolve, reject) => {
    _getUserMedia(constrains || { audio: true, video: true }, resolve, reject);
  });
 }

 function _getUserMedia(constrains, onSuccess, onFailure) {
  if(typeof window !=='undefined' && typeof navigator !== 'undefined') {
    if(typeof navigator.mediaDevices === 'object' && typeof navigator.mediaDevices.getUserMedia === 'function') {
      return navigator.mediaDevices.getUserMedia(constrains).then(onSuccess, onFailure);
    }else if(typeof navigator.getUserMedia === 'function') {
      return navigator.getUserMedia(constrains, onSuccess, onFailure);
    }
  }
  onFailure(new Error('getUserMedia is not supported'));
 }

export default getUserMedia
