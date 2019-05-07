'use strict';
let support = require('./rtcSupport').default;
/**
 * 
 */
function getMediaDevices() {
  return new Promise((resolve, reject) => {
    _getMediaDevices(resolve, reject);
  });
}

function _getMediaDevices(onSuccess, onFailure) {
  if(support.supportGetUserMedia){
    return navigator.mediaDevices.enumerateDevices().then(onSuccess, onFailure);
  }else{
    return navigator.enumerateDevices( onSuccess, onFailure);
  }
  onFailure(new Error('enumerateDevices fail'));
}

export default getMediaDevices
