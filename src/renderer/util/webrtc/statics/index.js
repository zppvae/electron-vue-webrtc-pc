
'use strict';

let RTCMain = require('./RTCMain').default;
let tool = require('./tool').default;

  var rtc = new RTCMain();
  var _this;
  var SVOCRtc = function () {
    var self = this;
    _this = this;
  }
  SVOCRtc.prototype.init = function (host, alias, displayName, pin, token, registration_token) {
    var self = this;
    // self.connect(pin);
    self.microphoneMuted = false;
    self.cameraMuted = false;
    self.pin = pin;
    rtc.makeCall(host, alias, displayName, null, 'none');
    setTimeout(() => {
      self.connect(pin);
    })
  };
  SVOCRtc.prototype.startCall = function (callType, videoSource, audioSource, flashElement) {
    rtc.call_type = callType;
    rtc.flash = flashElement;
    rtc.video_source = videoSource;
    rtc.audio_source = audioSource;
    // if (platformSettings.hasWebRTC && _this.remoteMediaStream) {
    //     rtc.renegotiate(callType);
    // } else {
        rtc.addCall(callType, flashElement);
    // }
  }
  SVOCRtc.prototype.getBandwidth = function () {
    return rtc.bandwidth_out + 64;
  }

  rtc.onSetup =function (stream, pinStatus, conferenceExtension) {
    setTimeout(() => {
      if(stream){
        // console.log('====localVideo', stream)
        tool.init('localVideo', stream);
      }else if (pinStatus !== 'none') {
        console.log('pin required', _this.pin);
        rtc.connect(_this.pin)
        // $rootScope.$broadcast('call::pinRequested', pinStatus === 'required');
      }else{
        _this.connect();
      }
    });
    
  }
  rtc.onConnect = function (stream) {
    setTimeout(() =>{
      tool.init('remoteVideo', stream);
      console.log('remoteMediaStream', stream)
    })
    
  }

  rtc.onPresentation = function(isActive, presenter) {
    setTimeout(() => {
      console.log('rtc.onPresentation', isActive, presenter);
        if (isActive) {
            // $rootScope.$broadcast('call::presentationStarted', presenter);
            this.presentationAcitve = true;
        } else {
            delete this.presentationAcitve;
            if (typeof this.screenShareMode === 'undefined') {
                // suppress presentationStopped event when we have stolen presentation
                // $rootScope.$broadcast('call::presentationStopped');
            }
        }
    });
  };
  rtc.onPresentationReload = function (src) {
    setTimeout(() => {
      if(this.presentationAcitve || this.screenShareMode === 'screen') {
        this.presentationImgSrc = src;
        // setTimeout(() => {
        //   tool.bindEvent_Src('presentationSrc', src);
        // }, 2000);

      }
    });
  }
  rtc.onPresentationConnected = function(src) {
    this.presentationVideoSrc = src;
  }
  rtc.onPresentationDisconnected = function(reason) {
    delete this.presentationVideoSrc;
  };
  rtc.onError = function(reason) {
    console.log(" onError", reason)
  }
  SVOCRtc.prototype.connect = function (pin, extension) {
    var self = this;
    self.microphoneMuted = rtc.muteAudio(false);
    self.cameraMuted = rtc.muteVideo(false);
    rtc.connect(pin, extension);
  }

  SVOCRtc.prototype.startScreenShare = function (params) {
    var self = this;
    self.screenShareMode = 'screen';
    rtc.present(self.screenShareMode);
  }

  SVOCRtc.prototype.stopScreenShare = function (params) {
    var self = this;
    delete self.screenShareMode;
    delete self.presentationImgSrc;
    delete self.presentationVideoSrc;
    rtc.present(null);
  }
  var screenshareCallback = null;


  SVOCRtc.prototype.imageShareStart = function (cb) {
    var self = this;
    console.log('Call.imageShareStart');
    screenshareCallback = cb;
    self.screenShareMode = 'screen_http';
    rtc.present(self.screenShareMode);
  }

  SVOCRtc.prototype.imageShareSetImage = function (dataURL) {
    console.log('Call.imageShareSetImage', dataURL)
    rtc.sendPresentationImage({
      files: [dataURL]
    });
  }

  SVOCRtc.prototype.startConference = function() {
    rtc.startConference();
  };
  SVOCRtc.prototype.disconnectAll = function() {
      rtc.disconnectAll();
  };
  SVOCRtc.prototype.disconnect = function(reason) {
    var self = this;
    delete self.presentationVideoSrc;
    try {
        rtc.present(null);
        rtc.stopPresentation();
        rtc.disconnectCall();
        rtc.disconnect(reason);
    } catch (e) {
        console.error('Failed to disconnect pexrtc', e);
    }
  };
  SVOCRtc.prototype.toggleLock = function() {
    var self = this;
    self.locked = !self.locked;
    rtc.setConferenceLock(self.locked);
  };

  SVOCRtc.prototype.toggleMicrophone = function() {
    var self = this;
    self.microphoneMuted = rtc.muteAudio();
  };
  SVOCRtc.prototype.toggleCamera = function() {
    var self = this;
    self.cameraMuted = rtc.muteVideo();
    return self.cameraMuted;
  };
  SVOCRtc.prototype.toggleMuteAllGuests = function() {
    var self = this;
    self.guestsMuted = !self.guestsMuted;
    rtc.setMuteAllGuests(self.guestsMuted);
  };

  SVOCRtc.prototype.getCallStatistics = function() {
      // var self = this;
      if (rtc.call.getMediaStatistics) {
          return rtc.call.getMediaStatistics();
      } else {
          return rtc.getMediaStatistics();
      }
  }

export default new SVOCRtc();
