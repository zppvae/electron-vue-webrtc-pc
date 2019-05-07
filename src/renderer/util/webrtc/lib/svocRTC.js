'use strict';

let RTCMain = require('./svocRTCMain').default;
let tool = require('./tool').default;
function svocRTC() {
  var _this = this;
  _this.remoteMediaStream = null;
}
svocRTC.prototype.init = function (host, alias, displayName, pin, token, registration_token) {
  var _this = this;
  RTCMain.onConnect = function (stream) {
    tool.init('remoteVideo', stream);
    console.log('-----remoteMediaStream-----', stream)
  }
  RTCMain.onSetup = function (stream, pinStatus, conferenceExtension) {
    setTimeout(() => {
      if(stream) {
        tool.init('localVideo', stream);
        console.log('-----localMediaStream-----', stream)
        _this.connect();
      } else if (_this.remoteMediaStream) { //platformSettings.hasWebRTC && 
        RTCMain.connect();
      } else if(pinStatus !== 'none') {
        console.log('-----pinStatus-----', pinStatus)
        _this.connect(pin);
      }else{
        _this.connect();
      }
    },7000);
    
  }
  RTCMain.onError = function (reason) {
    console.error('call::error', reason)
  }
  RTCMain.onDisconnect = function (msg) {
    return msg;
  }

  RTCMain.onPresentation = function(isActive, presenter) {
    setTimeout(() => {
      if (isActive) {
        // $rootScope.$broadcast('call::presentationStarted', presenter);
        _this.presentationAcitve = true;
      } else {
          delete _this.presentationAcitve;
          if (typeof _this.screenShareMode === 'undefined') {
              // suppress presentationStopped event when we have stolen presentation
              // $rootScope.$broadcast('call::presentationStopped');
          }
      }
    });
  };
  RTCMain.onPresentationReload = function(src) {
    setTimeout(() => {
      console.log('RTCMain.onPresentationReload', src);
      if (_this.presentationAcitve || _this.screenShareMode === 'screen') {
          // $rootScope.$broadcast('call::presentationUpdate', src);
          _this.presentationImgSrc = src; //$sce.trustAsResourceUrl(src);
      }
    });
  };
  RTCMain.onPresentationConnected = function(src) {
    setTimeout(() => {
      console.log('RTCMain.onPresentationConnected', src);
      // $rootScope.$broadcast('call::presentationVideoUpdate', src);
      if (src instanceof MediaStream) {
          _this.presentationVideoSrc = src;
      } else {
          _this.presentationVideoSrc = src; //$sce.trustAsResourceUrl(src);
      }
    });
  };
  RTCMain.onPresentationDisconnected = function(reason) {
    setTimeout(() => {
          // Only called when we are receiving video presentation and remote side stop
          console.log('RTCMain.onPresentationDisconnected', reason);
          if (reason && reason.indexOf(': ') > 0) {
              reason = reason.substr(reason.lastIndexOf(': ') + 2);
          }
          // $rootScope.$broadcast('call::presentationVideoUpdate', null, reason);
          delete _this.presentationVideoSrc;
      });
  };
  
  RTCMain.makeCall(host, alias, displayName, pin, null, 'none');
}
svocRTC.prototype.startCall = function (callType, videoSource, audioSource, flashElement) {
  var _this = this;
  console.log('----startCall-----', callType, videoSource, audioSource, flashElement)
  RTCMain.call_type = callType;
  RTCMain.flash = flashElement;
  RTCMain.video_source = videoSource;
  RTCMain.audio_source = audioSource;
  // platformSettings.hasWebRTC &&
  if (_this.remoteMediaStream) {
      RTCMain.renegotiate(callType);
  } else {
      RTCMain.addCall(callType, flashElement);
  }
  console.log('----startCall RTCMain-----', RTCMain)
}

svocRTC.prototype.connect = function (pin, extension) {
  var _this = this;
  console.log('Call.connect', pin, extension);
  _this.microphoneMuted = RTCMain.muteAudio();
  _this.cameraMuted = RTCMain.muteVideo();
  RTCMain.connect(pin, extension);
}

svocRTC.prototype.startPresentationVideo = function () {
  var _this = this;
  RTCMain.getPresentation();
}

svocRTC.prototype.stopPresentationVideo = function () {
  var _this = this;
  console.log('Call.stopPresentationVideo');
  RTCMain.stopPresentation();
  // $rootScope.$broadcast('call::presentationVideoUpdate', null);
  delete _this.presentationVideoSrc;
  _this.refreshPresentation();
}
svocRTC.prototype.refreshPresentation = function () {
  var _this = this;
  RTCMain.onPresentationReload(RTCMain.getPresentationURL());
}

svocRTC.prototype.startScreenShare = function () {
  var _this = this;
  console.log('Call.startScreenShare');
  _this.screenShareMode = 'screen';
  RTCMain.present(_this.screenShareMode);
}

svocRTC.prototype.stopScreenShare = function () {
  var _this = this;
  console.log('Call.stopScreenShare');
  delete _this.screenShareMode;
  delete _this.presentationImgSrc;
  delete _this.presentationVideoSrc;
  RTCMain.present(null);
}

svocRTC.prototype.getCallStatistics = function(callback) {
  var _this = this;
  if (RTCMain.call.getMediaStatistics) {
      return RTCMain.call.getMediaStatistics();
  } else {
      return RTCMain.getMediaStatistics();
  }
};

svocRTC.prototype.toggleMicrophone = function() {
  var _this = this;
  _this.microphoneMuted = RTCMain.muteAudio();
};
svocRTC.prototype.toggleCamera = function() {
  var _this = this;
  _this.cameraMuted = RTCMain.muteVideo();
  return _this.cameraMuted;
};

svocRTC.prototype.disconnectAll = function() {
  var _this = this;
  RTCMain.disconnectAll();
};
svocRTC.prototype.disconnect = function(reason) {
  var _this = this;
  console.log('Call.disconnect');
  delete _this.presentationVideoSrc;
  try {
    RTCMain.present(null);
    RTCMain.stopPresentation();
    RTCMain.disconnectCall();
    RTCMain.disconnect(reason);
  } catch (e) {
    console.error('Failed to disconnect pexrtc', e);
  }
};
export default new svocRTC()