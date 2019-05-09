'use strict';

let RTCSupport = require('./RTCSupport').default;
let RTCCall = require('./svocRTCCall').default;
let RTMPCall = require('./pexRtmp').default;
let rtcPort = require('./pexPort').default;
let RTCStatistics = require('./getRtcStatistics').default;
let tool = require('./tool').default;

var support = RTCSupport;
var Call = RTCCall;
var RTMP = RTMPCall;
function SvocRtc() {
  var self = this;
  var turnServer = JSON.parse(localStorage.getItem('turnServer')) || { turnurl:'', name: '', pwd: '' };
  self.state = 'IDLE';
  self.conference = null;
  self.conference_uri = '';
  self.role = null;
  self.version = null;
  self.display_name = null;
  self.bandwidth_in = 1280;
  self.bandwidth_out = 1280;
  self.oneTimeToken = null;
  self.conference_extension = null;
  self.localStream = null;
  self.node = null;
  self.socket = null;
  self.uuid = null;
  self.onHold = false;
  self.last_ping = null;
  self.pc = null;
  self.pcConfig = {};
  self.default_stun = null;
  self.turn_server = {'url': turnServer.turnurl, 'username': turnServer.name, 'credential': turnServer.pwd },
  self.pin = null;
  self.pin_status = 'none';
  self.call_type = '';
  self.mutedAudio = false;
  self.mutedVideo = false;
  self.audio_source = null;
  self.video_source = null;
  self.recv_audio = true;
  self.recv_video = true;
  self.event_listener = null;
  self.screenshare_api = 'pexGetScreen';
  self.screenshare_fps = 5;
  self.screenshare_width = window.screen.width;
  self.screenshare_height = window.screen.height;
  self.powerLineFrequency = 0;
  self.token = null;
  self.token_refresh = null;
  self.registration_token = null;
  self.event_source = null;
  self.event_source_timeout = 0;
  self.rosterList = {};
  self.presentation_msg = {'status': ''};
  self.presentation_event_id = null;
  self.chat_enabled = false;
  self.fecc_enabled = false;
  self.rtmp_enabled = true;
  self.rtsp_enabled = false;
  self.analytics_enabled = false;
  self.allow_1080p = false;
  self.service_type = null;
  self.current_service_type = null;
  self.remote_call_type = null;
  self.guests_can_present = true;
  self.dtmf_queue = {};
  self.fecc_queue = {};
  self.h264_enabled = true;
  self.png_presentation = false;
  self.basic_username = null;
  self.basic_password = null;
  self.user_media_stream = null;
  self.return_media_stream = false;

  self.screenshare = null;
  self.presentation = null;
  self.call = null;
  self.flash = undefined;
  self.error = null;

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
  self.stats = RTCStatistics;
  self.stats.parent = self;
  self.stats_interval = null;

  self.chrome_ver = support.browserVersion.chrome_ver;
  self.firefox_ver = support.browserVersion.firefox_ver;
  self.edge_ver = support.browserVersion.edge_ver;
  self.safari_ver = support.browserVersion.safari_ver;
  self.is_android = navigator.userAgent.indexOf('Android') != -1;

  if (navigator.userAgent.indexOf("Chrome") != -1) {
    self.chrome_ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
  } else {
      self.chrome_ver = 0;
  }

  if (navigator.userAgent.indexOf("Firefox") != -1) {
      self.firefox_ver = parseInt(window.navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);
      if (self.firefox_ver < 38) {
          self.h264_enabled = false;
      }
  } else {
      self.firefox_ver = 0;
  }

  if (navigator.userAgent.indexOf("Edge") != -1) {
      self.edge_ver = parseInt(window.navigator.userAgent.match(/Edge\/\d+\.(\d+)/)[1], 10);
      self.chrome_ver = 0;
  } else {
      self.edge_ver = 0;
  }

  if (self.chrome_ver == 0 && navigator.userAgent.indexOf("Safari") != -1) {
      self.safari_ver = parseInt(window.navigator.appVersion.match(/Safari\/(\d+)\./)[1], 10);
  } else {
      self.safari_ver = 0;
  }

  if (self.safari_ver == 0 && (self.chrome_ver >= 57 || navigator.userAgent.indexOf('OS X') != -1)) {
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

  self.trans = {
      ERROR_SCREENSHARE_CANCELLED: "Screenshare cancelled",
      ERROR_CALL_FAILED: "Call Failed: ",
      ERROR_WEBRTC_SUPPORT: "Error: WebRTC not supported by this browser",
      ERROR_SCREENSHARE_EXTENSION: "Error: Screenshare extension not found.\n\nHave you installed it from http://www.pexip.com/extension/?",
      ERROR_USER_MEDIA: "Error: Could not get access to camera/microphone.\n\nHave you allowed access? Has any other application locked the camera?",
      ERROR_ICE_CANDIDATES: "Failed to gather IP addresses",
      ERROR_PRESENTATION_ENDED: "Presentation ended",
      ERROR_DISCONNECTED_PRESENTATION: "Presentation stream remotely disconnected",
      ERROR_DISCONNECTED_SCREENSHARE: "Screenshare remotely disconnected",
      ERROR_DISCONNECTED: "You have been remotely disconnected from this conference",
      ERROR_CONNECTING_PRESENTATION: "Presentation stream unavailable",
      ERROR_CONNECTING_SCREENSHARE: "Screenshare error",
      ERROR_CONNECTING: "Error connecting to conference"
  };
}

SvocRtc.prototype.makeCall = function (node, conf, name, pin, bw, call_type, flash) {
  var self = this;

  self.state = 'ACTIVE';
  self.node = node;
  self.conference = conf;
  self.conference_uri = encodeURIComponent(conf);
  self.display_name = name;
  self.pin = pin;
  self.call_type = call_type;
  self.flash = flash;

  if (bw) {
      self.bandwidth_in = parseInt(bw);
      self.bandwidth_out = self.bandwidth_in;
  }

  rtcPort.init(self, function () {
    self.addCall(self.call_type, null);
  })
//   Call.init(self, params, function () {
//     self.addCall(self.call_type, null);
//   });

  // self.requestToken(function() {
  //     self.createEventSource();
  //     if (self.state != 'DISCONNECTING') {
  //         if (self.call_type != 'none') {
  //             self.flash = flash;
  //             self.addCall(null, flash);
  //         } else {
  //             self.onSetup(null, self.pin_status, self.conference_extension);
  //         }
  //     }
  // });
};
SvocRtc.prototype.disconnectAll = function() {
  var self = this;
  rtcPort.disconnectAll();
};

SvocRtc.prototype.connect = function(pin, extension) {
  var self = this;
    console.log("SvocRtc=====",self)
  var doConnect = function() {
      if (self.state != 'DISCONNECTING') {
          if (self.call) {
              self.call.connect();
          } else {
              self.onConnect();
          }
      }
  };

  if (self.pin_status != 'none') {
      self.pin_status = 'none';
      self.pin = pin || 'none';
      rtcPort.init(self)
      // self.requestToken(function () {
      //     self.createEventSource();
      //     doConnect();
      // });
  } else if (extension) {
      self.conference_extension = extension;
      // self.requestToken(function () {
      //     self.createEventSource();
      //     self.onSetup(null, self.pin_status);
      // });
      rtcPort.init(self)
  } else {
      doConnect();
  }
};

SvocRtc.prototype.addCall = function(call_type, flash) {
  var self = this;

  var obj;
  if (call_type == 'screen_http') {
      // obj = new PexJPEGPresentation();
  } else if (flash || self.call_type == 'rtmp' || self.call_type == 'stream') {
      obj = RTMP;
  } else if (self.call && !call_type) {
      obj = self.call;
  } else {
      obj = Call;
  }

  if (!self.screenshare && (call_type == 'screen' || call_type == 'screen_http')) {
      self.screenshare = obj;
      self.screenshare.onSetup = function(stream) {
        self.screenshare.connect();
      };
      self.screenshare.onConnect = function(stream) {
          self.presentation_msg = {'status': ''};
          if (self.onScreenshareConnected) {
              self.onScreenshareConnected(stream);
          }
      };
      self.screenshare.onDisconnect = function(reason) {
          self.screenshare = null;
          if (self.onScreenshareStopped) {
              self.onScreenshareStopped(reason);
          }
      };
      self.screenshare.onError = function(reason) {
          self.screenshare = null;
          if (self.onScreenshareStopped) {
              self.onScreenshareStopped(reason);
          }
      };
      self.screenshare.onScreenshareMissing = function() {
          self.screenshare = null;
          if (self.onScreenshareMissing) {
              self.onScreenshareMissing();
          } else {
            self.onScreenshareStopped(self.trans.ERROR_SCREENSHARE_EXTENSION);
          }
      };
      self.screenshare.makeCall(self, call_type);
  } else if (!self.presentation && call_type == 'presentation') {
      self.presentation = obj;
      self.presentation.onSetup = function(stream) {
          self.presentation.connect();
      };
      self.presentation.onConnect = function(stream) {
          if (self.onPresentationConnected) {
              self.onPresentationConnected(stream);
          }
      };
      self.presentation.onDisconnect = function(reason) {
          self.presentation = null;
          if (self.onPresentationDisconnected) {
              self.onPresentationDisconnected(reason);
          }
      };
      self.presentation.onError = function(reason) {
          self.presentation = null;
          if (self.onPresentationDisconnected) {
              self.onPresentationDisconnected(reason);
          }
      };
      self.presentation.makeCall(self, call_type);
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
                  self.onError(self.trans.ERROR_SCREENSHARE_EXTENSION);
              }
          };
      }

      if ((self.call_type == 'video' || self.call_type == 'rtmp') && self.remote_call_type == 'audio') {
          self.call_type = 'audioonly';
      }

      self.call.makeCall(self, self.call_type);

      var pollMediaStatistics = function() {
          if (self.call.pc && self.call.pc.getStats) {
              if (self.chrome_ver > 0) {
                  self.call.pc.getStats(function (rawStats) {
                      self.stats.updateStats(rawStats.result());
                  });
              } else if (self.firefox_ver > 47) {
                  self.call.pc.getStats(null).then(function (rawStats) {
                      self.stats.updateStatsFF(rawStats);
                  });
              } else if (self.safari_ver > 603) {
                  self.call.pc.getStats(null).then(function (rawStats) {
                      self.stats.updateStatsSafari(rawStats);
                  });
              }
          }
      };
      self.stats_interval = setInterval(pollMediaStatistics, 1000);
  } else if (self.call) {
      self.call.makeCall(self, self.call_type);
  }
  return obj;
};
SvocRtc.prototype.disconnectCall = function(referral) {
  var self = this;

  if (self.call) {
      self.call.disconnect(false, referral);
      if (!referral) {
          if (self.stats_interval) {
              clearInterval(self.stats_interval);
              self.stats_interval = null;
          }
          self.call = null;
          self.flash = undefined;
      }
  }
};

SvocRtc.prototype.renegotiate = function(call_type) {
  var self = this;

  if (self.call && self.call.update) {
      self.call.update(call_type === undefined ? self.call_type : call_type);
  }
};

SvocRtc.prototype.clearLocalStream = function() {
  var self = this;

  if (self.call && self.call.pc) {
      var streams = self.call.pc.getLocalStreams();
      for (var i=0; i<streams.length; i++) {
          self.call.pc.removeStream(streams[i]);
      }
      self.call.localStream = null;
  }
  self.user_media_stream = null;
};

SvocRtc.prototype.present = function(call_type) {
  var self = this;
  if (!self.screenshare && call_type) {
      self.addCall(call_type, null);
  } else if (self.screenshare && !call_type) {
      self.screenshare.disconnect(false);
      self.screenshare = null;
      if (self.firefox_ver > 43) {
          self.onScreenshareStopped(self.trans.ERROR_PRESENTATION_ENDED);
      }
  }
};

SvocRtc.prototype.muteAudio = function(setting) {
  var self = this;

  if (self.call) {
      self.mutedAudio = self.call.muteAudio(setting);
  } else if (setting !== undefined) {
      self.mutedAudio = setting;
  } else {
      self.mutedAudio = !self.mutedAudio;
  }

  return self.mutedAudio;
};

SvocRtc.prototype.muteVideo = function(setting) {
  var self = this;

  if (self.call) {
      self.mutedVideo = self.call.muteVideo(setting);
  } else if (setting !== undefined) {
      self.mutedVideo = setting;
  } else {
      self.mutedVideo = !self.mutedVideo;
  }

  return self.mutedVideo;
};


SvocRtc.prototype.getPresentationURL = function() {
  var self = this;
  var url = null;
  var presentation_image = 'presentation.jpeg';
  if (self.presentation_event_id) {
      if (self.png_presentation) {
          url = "https://" + self.node + "/api/client/v2/conferences/" + self.conference_uri + "/presentation.png?id=" + self.presentation_event_id + "&token=" + self.token;
      } else {
    if (self.bandwidth_in > 512) {
  presentation_image = "presentation_high.jpeg";
    }
          url = "https://" + self.node + "/api/client/v2/conferences/" + self.conference_uri + "/" + presentation_image + "?id=" + self.presentation_event_id + "&token=" + self.token;
      }
  }
  return url;
};


SvocRtc.prototype.getPresentation = function() {
  var self = this;

  if (!self.presentation) {
      self.addCall("presentation");
  } else if (self.onPresentationConnected) {
      if (self.return_media_stream) {
          self.onPresentationConnected(self.presentation.stream);
      } else {
          var url = window.URL || window.webkitURL || window.mozURL;
          self.onPresentationConnected(url.createObjectURL(self.presentation.stream));
      }
  }
};

SvocRtc.prototype.stopPresentation = function() {
  var self = this;

  if (self.presentation) {
      self.presentation.disconnect(false);
      self.presentation = null;
  }
};


SvocRtc.prototype.processPresentation = function(msg) {
  var self = this;

  if (msg.status == "newframe") {
      if (self.onPresentationReload && !self.onHold) {
          self.onPresentationReload(self.getPresentationURL());
      }
  } else {
      if (self.onPresentation) {
          if (msg.status == "start") {
              var presenter;
              if (msg.presenter_name !== "") {
                  presenter = msg.presenter_name + " <" + msg.presenter_uri + ">";
              } else {
                  presenter = msg.presenter_uri;
              }
              self.onPresentation(true, presenter);
          } else if (msg.status == "stop") {
              self.onPresentation(false, null);
          }
      }
  }
};

SvocRtc.prototype.processRefer = function(msg) {
  var self = this;

  self.disconnect("Call transferred", true);
  self.state = 'IDLE';

  if (self.onCallTransfer) {
      self.onCallTransfer(msg.alias);
  }

  self.oneTimeToken = msg.token;

  if (self.state != 'DISCONNECTING') {
      setTimeout(function() {
        self.makeCall(self.node, msg.alias, self.display_name, self.bandwidth_in, self.call_type, self.flash);
      }, 500);
  }
};

SvocRtc.prototype.disconnect = function(reason, referral) {
  var self = this;

  self.state = 'DISCONNECTING';
  self.onLog('Disconnecting...');
  self.conference_extension = null;

  if (referral) {
      self.disconnectCall(true);
  } else {
      self.disconnectCall();
  }
  self.present(null);
  self.stopPresentation();

  if (self.event_source) {
      self.event_source.close();
      self.event_source = null;
  }
  if (self.token_refresh) {
      clearInterval(self.token_refresh);
      self.token_refresh = null;
  }
  if (self.token) {
      var params = {};
      if (self.error) {
          params['error'] = self.error;
      }
      if (reason) {
          params['reason'] = reason;
      }
      rtcPort.releaseToken(self.token)
      // self.sendRequest("release_token", params, false);
      self.token = null;
  }
};

SvocRtc.prototype.sendPresentationImage = function(file) {
  var self = this;
  if (self.screenshare && self.screenshare.sendPresentationImageFile) {
      self.screenshare.sendPresentationImageFile(file);
  }
};

SvocRtc.prototype.getMediaStatistics = function() {
  var self = this;

  return self.stats.getStats();
};

export default new SvocRtc()
