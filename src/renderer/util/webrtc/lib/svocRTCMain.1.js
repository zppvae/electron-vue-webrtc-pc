'use strict';
let RTCSupport = require('./RTCSupport').default;
let RTCCall = require('./svocRTCCall').default;
let RTMPCall = require('./pexRtmp').default;
let tool = require('./tool').default;

  
  var support = RTCSupport;
  var Call = RTCCall;
  var RTMP = RTMPCall;
  
  var turnServer = JSON.parse(tool.getCookieObj('turnServer')) || {turnurl:'', name: '', pwd: ''};

  var Main = function(){
    var self = this;
    self.node = null;
    self.conference_uri = '';
    self.pin = null;
    self.pin_status = 'none';
    self.uuid = '';
    self.display_name = null;
    self.bandwidth_in = 1280;
    self.bandwidth_out = 1280;
    self.localStream = null;
    self.state = 'IDLE';
    self.call_type = 'video';
    self.default_stun = null;
    // self.turn_server = null;
    self.turn_server = {'url': turnServer.turnurl, 'username': turnServer.name, 'credential': turnServer.pwd },
    self.pc = null;
    self.pcConfig = {};
    self.mutedAudio = false;
    self.mutedVideo = false;
    self.audio_source = null;
    self.video_source = null;
    
    self.token = '';
    self.recv_audio = true;
    self.recv_video = true;
    self.h264_enabled = true;
    self.allow_1080p = false;
    self.ice_candidates = [];
    self.host_candidate = null;

    self.user_media_stream = null;
    self.return_media_stream = false;

    self.screenshare = null;
    self.presentation = null;
    self.call = null;
    self.flash = undefined;
    self.error = null;
    

    self.chrome_ver = support.browserVersion.chrome_ver;
    self.firefox_ver = support.browserVersion.firefox_ver;
    self.edge_ver = support.browserVersion.edge_ver;
    self.safari_ver = support.browserVersion.safari_ver;
    self.is_android = navigator.userAgent.indexOf('Android') != -1;

    self.onError = null;
    self.onSetup = null;
    self.onConnect = null;
    self.onHoldResume = null;
    self.onDisconnect = null;
    self.onPresentation = null;
    self.onPresentationReload = null;
    self.onPresentationConnected = null;
    self.onPresentationDisconnected = null;
    self.onRosterList = null;
    self.onScreenshareStopped = null;
    self.onScreenshareMissing = null;
    self.onCallTransfer = null;
    self.onCallDisconnect = null;

    self.onParticipantCreate = null;
    self.onParticipantUpdate = null;
    self.onParticipantDelete = null;
    self.onSyncBegin = null;
    self.onSyncEnd = null;
    self.onChatMessage = null;
    self.onStageUpdate = null;
    self.onMicActivity = null;
    self.onLog = function() { console.log.apply(console, arguments); };
    

    if (self.safari_ver == 0 && (self.chrome_ver >= 56 || navigator.userAgent.indexOf('OS X') != -1)) {
      // Disable H.264 to work around various issues:
      //   - H.264 hw accelerated decoding fails for some versions
      //     and some hardware, both on OS X and Windows.
      //   - Chrome OS X possibly does not trigger
      //     googCpuLimitedResolution when struggling to encode full
      //     resolution H.264, and thus we're not able to fall back
      //     to VP8 when needed.
      self.h264_enabled = false;
    }
    if (self.safari_ver > 603 || self.chrome_ver > 65 || self.firefox_ver > 59) {
      self.return_media_stream = true;
    }
    
  }
  Main.prototype.init = function (params, type) {
    var self = this;
    self.state = 'ACTIVE';
    self.audio_source = params.audioSourceId;
    self.video_source = params.videoSourceId;

    self.conference = params.host;
    self.display_name = params.name;
    self.call_type = params.call_type;

    if (params.bw) {
      self.bandwidth_in = parseInt(params.bw);
      self.bandwidth_out = self.bandwidth_in;
    }
    if(type === 'rtmp'){
      RTMP.init(self, params)
      // RTMP.connect();
    }else{
      Call.init(self, params, function () {
        self.addCall(self.call_type, null);
        console.log('addCall ==== ');
      });
      // Call.connect();
      // self.addCall(self.call_type, null)
    }
    self.onConnect = function (stream) {
      tool.init('remoteVideo', stream);
      console.log('remoteMediaStream-----', stream)
    }
    self.onSetup = function (stream) {
        console.log('====localVideo', stream)
        tool.init('localVideo', stream);
        self.connect(stream);
    }
    self.onDisconnect = function (msg) {
        return msg;
    }

  }
  Main.prototype.connect = function(stream, type){
    var self = this;
    if(type === 'rtmp'){
      RTMP.connect();
    }else{
      Call.connect();
    }
    console.log('remoteMediaStream', stream)
  }
  Main.prototype.addCall = function (call_type, flash) {
    var self = this;
    var obj;
    if (call_type == 'screen_http') {
      // obj = new PexJPEGPresentation();
    } else if (flash || self.call_type == 'rtmp' || self.call_type == 'stream') {
      // obj = RTMP;
    } else if (self.call && !call_type) {
      obj = self.call;
    } else {
      obj = Call;
    }

    if(!self.screenshare && (call_type == 'screen' || call_type == 'screen_http')){

    } else if (!self.presentation && call_type == 'presentation') {

    } else if (!self.call) {
      self.call = obj;
      self.call.onSetup = function(stream) {
        self.onSetup(stream, self.pin_status, self.conference_extension);
      };
      self.call.onConnect = function(stream) {
          if (self.mutedAudio) {
              self.muteAudio(self.mutedAudio);
          }
          if (self.mutedVideo) {
              self.muteVideo(self.mutedVideo);
          }
          console.log('call.onConnect')
          self.onConnect(stream);
      };
      self.call.onDisconnect = function(reason) {
          if (self.call) {
              if (self.stats_interval) {
                  clearInterval(self.stats_interval);
                  self.stats_interval = null;
              }
              self.call = null;
              if (self.onCallDisconnect) {
                  self.onCallDisconnect(reason);
              } else {
                  self.disconnect(reason);
                  self.onDisconnect(reason);
              }
          }
      };
      self.call.onError = function(reason) {
          if (self.call && self.state != 'DISCONNECTING') {
              if (self.stats_interval) {
                  clearInterval(self.stats_interval);
                  self.stats_interval = null;
              }
              self.call = null;
              self.error = reason;
              self.onError(reason);
          }
      };
      self.call.onMicActivity = function() {
          if (self.onMicActivity) {
              self.onMicActivity();
          }
      };
      if (self.call_type == 'screen' || self.call_type == 'screen_http') {
          self.call.onScreenshareMissing = function() {
              if (self.stats_interval) {
                  clearInterval(self.stats_interval);
                  self.stats_interval = null;
              }
              self.call = null;
              if (self.onScreenshareMissing) {
                  self.onScreenshareMissing();
              } else {
                  // self.onError(self.trans.ERROR_SCREENSHARE_EXTENSION);
              }
          };
      }

      if ((self.call_type == 'video' || self.call_type == 'rtmp') && self.remote_call_type == 'audio') {
          self.call_type = 'audioonly';
      }

      self.call.makeCall(self, self.call_type);
    } else if (self.call) {
      self.call.makeCall(self, self.call_type);
    }

    return obj;
  },

  Main.prototype.disconnectCall = function (type) {
    var self = this;
    if(type === 'rtmp'){
      RTMP.disconnect();
    }else{
      Call.disconnect(false)
    }
  }
  Main.prototype.disconnect = function(type) {
    var self = this;
    self.state = 'DISCONNECTING';
    self.disconnectCall(type)

  }

  Main.prototype.muteAudio = function(setting) {
    var self = this;
    if (Call) {
      self.mutedAudio = Call.muteAudio(setting);
    } else if (setting !== undefined) {
      self.mutedAudio = setting;
    } else {
      self.mutedAudio = !self.mutedAudio;
    }
    console.log('切换麦克风：',self.mutedAudio)
    return self.mutedAudio;
  }

  Main.prototype.muteVideo = function(setting) {
    var self = this;
    if (Call) {
      self.mutedVideo = Call.muteVideo(setting);
    } else if (setting !== undefined) {
      self.mutedVideo = setting;
    } else {
      self.mutedVideo = !self.mutedVideo;
    }
    console.log('切换摄像头：',self.mutedVideo)
    return self.mutedVideo;
  }

  Main.prototype.changeDevices = function(devices) {
    var self = this;
    self.video_source = devices.videoSourceId;
    self.audio_source = devices.audioSourceId;
    console.log('devices====',devices)
    Call.changeDevices(self.call_type);
  }
  Main.prototype.getMediaStatistics = function() {
    var self = this;
    return Call.getMediaStatistics();
  }
  
  export default new Main()
