'use strict';

let RTCCall = require('./RTCCall').default;
let JPEGPresentation = require('./JPEGPresentation').default;
let RTCStatistics = require('./getRtcStatistics').default;


  function RTCMain() {
    var self = this;
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
    self.turn_server = null;
    // turn_server todo
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
    self.stats = new RTCStatistics();
    self.stats.parent = self;
    self.stats_interval = null;

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


  RTCMain.prototype.makeCall = function (node, conf, name, bw, call_type, flash) {
      var self = this;

      self.state = 'ACTIVE';
      self.node = node;
      self.conference = conf;
      self.conference_uri = encodeURIComponent(conf);
      self.display_name = name;
      self.call_type = call_type;
      self.flash = flash;
      if (bw) {
          self.bandwidth_in = parseInt(bw);
          self.bandwidth_out = self.bandwidth_in;
      }

      self.requestToken(function() {
          self.createEventSource();
          if (self.state != 'DISCONNECTING') {
              if (self.call_type != 'none') {
                  self.flash = flash;
                  self.addCall(null, flash);
              } else {
                  self.onSetup(null, self.pin_status, self.conference_extension);
              }
          }
      });
  };

  RTCMain.prototype.sendRequest = function(request, params, cb, req_method, retries) {
      var self = this;

      // Only do async if explicitly asked
      var async = cb === false ? false : true;
      var method = req_method || "POST";
      var xhr = new XMLHttpRequest();
      var xhrUrl = "https://" + self.node + "/api/client/v2/conferences/" + self.conference_uri + "/" + request;
      self.onLog("RTCMain.sendRequest", request, params, method, xhrUrl);
      xhr.open(method, xhrUrl, async);
      if (cb) {
          xhr.onload = cb;
      }
      if (retries === undefined) {
          retries = 0;
      }
      xhr.onerror = function() {
          if (++retries > 10 || cb === false) {
              self.error = "Error sending request: " + request;
              self.onError(self.trans.ERROR_CONNECTING);
          } else {
              setTimeout(function() { self.sendRequest(request, params, cb, method, retries); }, retries * 500);
          }
      };
      xhr.ontimeout = function() {
          if (++retries > 10 || cb === false) {
              self.error = "Timeout sending request: " + request;
              self.onError(self.trans.ERROR_CONNECTING);
          } else {
              setTimeout(function() { self.sendRequest(request, params, cb, method, retries); }, retries * 500);
          }
      };
      /*xhr.withCredentials = true;*/
    //   if(getCookie("JwtToken")){
    //     xhr.setRequestHeader("JwtToken",getCookie("JwtToken"));
    //   }
      if (self.token) {
          xhr.setRequestHeader('token', self.token);
      } else if (self.pin !== null) {
          xhr.setRequestHeader('pin', self.pin);
      }
      if (self.basic_username && self.basic_password) {
          xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.basic_username + ':' + self.basic_password));
      }
      if (params) {
          xhr.setRequestHeader('Content-type', 'application/json');
          xhr.send(JSON.stringify(params));
      } else {
          xhr.send();
      }
      if (cb === false) {
          self.onLog("RTCMain.sendRequest response", xhr.responseText);
          var msg = {};
          try {
              msg = JSON.parse(xhr.responseText);
          } catch (error) {
              msg.reason = xhr.status + " " + xhr.statusText;
          }
          msg.http_status = xhr.status;
          return msg;
      }
  };

  RTCMain.prototype.requestToken = function(cb) {
      var self = this;
      var msg;
      if (!self.token) {
          var params = {'display_name': self.display_name};
          if (self.registration_token) {
              params.registration_token = self.registration_token;
          }
          if (self.oneTimeToken) {
              params.token = self.oneTimeToken;
              self.oneTimeToken = null;
          }
          if (self.conference_extension) {
              params.conference_extension = self.conference_extension;
          }

          msg = self.sendRequest("request_token", params, function(evt) { self.tokenRequested(evt, cb); });
      } else if (cb) {
          cb();
      }
  };

  RTCMain.prototype.tokenRequested = function(e, cb) {
      var self = this;

      var msg = {};
      try {
          msg = JSON.parse(e.target.responseText);
          msg.http_status = e.target.status;
      } catch (error) {
          msg.reason = e.target.status + " " + e.target.statusText;
      }

      self.onLog("RTCMain.tokenRequested response", e.target.responseText);

      if (msg.http_status == 200) {
          self.token = msg.result.token;
          self.uuid = msg.result.participant_uuid;
          self.role = msg.result.role;
          self.version = msg.result.version;
          self.chat_enabled = msg.result.chat_enabled;
          self.fecc_enabled = msg.result.fecc_enabled;
          self.rtmp_enabled = msg.result.rtmp_enabled;
          self.rtsp_enabled = msg.result.rtsp_enabled;
          self.analytics_enabled = msg.result.analytics_enabled;
          self.allow_1080p = msg.result.allow_1080p;
          self.service_type = msg.result.service_type;
          self.current_service_type = msg.result.current_service_type;
          self.remote_call_type = msg.result.call_type;
          self.guests_can_present = msg.result.guests_can_present;

          if (self.edge_ver > 10527) {
              self.pcConfig.bundlePolicy = 'max-compat';
          }

          self.pcConfig.iceServers = [];
          if (self.default_stun) {
              if (self.firefox_ver > 43 || self.edge_ver > 10527 || self.safari_ver > 603) {
                  self.pcConfig.iceServers.push({ 'urls' : [self.default_stun] });
              } else {
                  self.pcConfig.iceServers.push({ 'url' : self.default_stun });
              }
          }
          if (self.turn_server && self.edge_ver == 0) {
              var turn_servers = []
              if (self.turn_server instanceof Array) {
                  turn_servers = self.turn_server;
              } else {
                  turn_servers.push(self.turn_server);
              }

              for (var i=0; i<turn_servers.length; i++) {
                  if (self.safari_ver > 603) {
                      var is_tcp = false;
                      if (turn_servers[i].hasOwnProperty('url') && turn_servers[i].url.indexOf('transport=tcp') != -1) {
                          is_tcp = true;;
                      } else if (turn_servers[i].hasOwnProperty('urls')) {
                          for (var j=0; j<turn_servers[i].urls.length; j++) {
                              if (turn_servers[i].urls[j].indexOf('transport=tcp') != -1) {
                                  is_tcp = true;;
                              }
                          }
                      }

                      if (is_tcp) {
                          continue;
                      }
                  }
                  self.pcConfig.iceServers.push(turn_servers[i]);
              }
          }
          if ('stun' in msg.result && self.edge_ver == 0) {
              for (var i = 0; i < msg.result.stun.length; i++) {
                  if (self.firefox_ver > 43 || self.safari_ver > 603) {
                      self.pcConfig.iceServers.push({ 'urls' : [msg.result.stun[i].url] });
                  } else {
                      self.pcConfig.iceServers.push(msg.result.stun[i]);
                  }
              }
          }
          self.onLog("ICE Servers:", self.pcConfig);

          if ('bandwidth_in' in msg.result) {
              self.set_bandwidth_in = msg.result.bandwidth_in - 64;
              if (self.set_bandwidth_in < self.bandwidth_in) {
                  self.bandwidth_in = self.set_bandwidth_in;
              }
          }
          if ('bandwidth_out' in msg.result) {
              self.set_bandwidth_out = msg.result.bandwidth_out - 64;
              if (self.set_bandwidth_out < self.bandwidth_out) {
                  self.bandwidth_out = self.set_bandwidth_out;
              }
          }
      } else if (msg.http_status == 403 && msg.status === 'success') {
          if ('pin' in msg.result) {
              if (msg.result.guest_pin == 'none') {
                  self.pin_status = 'optional';
              } else {
                  self.pin_status = 'required';
              }
          }
          if ('conference_extension' in msg.result) {
              self.conference_extension = msg.result.conference_extension_type;
          }
      } else {
          return self.handleError(msg.result || msg.reason);
      }

      if (!self.token_refresh && self.token) {
          var expires = msg.result.expires || 120;
          self.token_refresh = setInterval(self.refreshToken.bind(this), (expires * 1000) / 3);

          self.sendRequest("conference_status", null, function(e) {
              self.onLog("conference_status");
              if (e.target.status == 200 && self.onConferenceUpdate) {
                  var msg = JSON.parse(e.target.responseText);
                  self.onLog(msg);
                  self.onConferenceUpdate(msg.result);
              }
          }, "GET");
      }


      if (cb) {
          cb();
      }
  };

  RTCMain.prototype.refreshToken = function() {
      var self = this;

      self.sendRequest("refresh_token", null,  function(e) {
          self.onLog("RTCMain.refreshToken response", e.target.responseText);
          var msg = {};
          try {
              msg = JSON.parse(e.target.responseText);
          } catch (error) {
              msg.reason = e.target.status + " " + e.target.statusText;
          }
          if (e.target.status == 200) {
              self.token = msg.result.token;
              if (msg.result.role != self.role) {
                  self.role = msg.result.role;
                  if (self.onRoleUpdate) {
                      self.onRoleUpdate(self.role);
                  }
              }
          } else {
              return self.handleError(msg.result || msg.reason);
          }
      });
  };

  RTCMain.prototype.createEventSource = function() {
      var self = this;

      if (!self.event_source && self.token) {
        self.event_source = new EventSource("https://" + self.node + "/api/client/v2/conferences/" + self.conference_uri + "/events?token=" + self.token);
          self.event_source.addEventListener("presentation_start", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("presentation_start", msg);
              msg.status = "start";
              if (self.presentation_msg.status != 'start' ||
                  self.presentation_msg.presenter_uuid != msg.presenter_uuid) {
                  self.processPresentation(msg);
              }
              self.presentation_msg = msg;
          }, false);
          self.event_source.addEventListener("presentation_stop", function(e) {
              var msg = {'status': "stop"};
              self.onLog("presentation_stop", msg);
              if (self.presentation_msg.status != 'stop') {
                  self.processPresentation(msg);
              }
              self.presentation_msg = msg;
          }, false);
          self.event_source.addEventListener("presentation_frame", function(e) {
              self.presentation_event_id = e.lastEventId;
              if (self.onPresentationReload && !self.onHold) {
                  self.onPresentationReload(self.getPresentationURL());
              }
          }, false);
          self.event_source.addEventListener("participant_create", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("participant_create", msg);
              self.rosterList[msg.uuid] = msg;
              if (msg.uuid == self.uuid && self.current_service_type && msg.service_type) {
                  self.current_service_type = msg.service_type;
              }
              if (!self.oldRosterList) {
                  if (self.onParticipantCreate) {
                      self.onParticipantCreate(msg);
                  }
                  if (self.onRosterList) {
                      self.onRosterList(self.getRosterList());
                  }
              }
          }, false);
          self.event_source.addEventListener("participant_update", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("participant_update", msg);
              self.rosterList[msg.uuid] = msg;
              if (msg.uuid == self.uuid && self.current_service_type && msg.service_type) {
                  self.current_service_type = msg.service_type;
              }
              if (!self.oldRosterList) {
                  if (self.onParticipantUpdate) {
                      self.onParticipantUpdate(msg);
                  }
                  if (self.onRosterList) {
                      self.onRosterList(self.getRosterList());
                  }
              }
          }, false);
          self.event_source.addEventListener("participant_delete", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("participant_delete", msg);
              delete self.rosterList[msg.uuid];
              if (!self.oldRosterList) {
                  if (self.onParticipantDelete) {
                      self.onParticipantDelete(msg);
                  }
                  if (self.onRosterList) {
                      self.onRosterList(self.getRosterList());
                  }
              }
          }, false);
          self.event_source.addEventListener("message_received", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("message_received", msg);
              if (self.onChatMessage) {
                  self.onChatMessage(msg);
              }
          }, false);
          self.event_source.addEventListener("participant_sync_begin", function(e) {
              self.onLog("participant_sync_begin");
              if (!self.oldRosterList) {
                  self.oldRosterList = self.rosterList;
              }
              self.rosterList = {};
              if (self.onSyncBegin) {
                  self.onSyncBegin();
              }
          }, false);
          self.event_source.addEventListener("participant_sync_end", function(e) {
              self.onLog("participant_sync_end", self.rosterList);
              for (var uuid in self.rosterList) {
                  if (!(uuid in self.oldRosterList) && self.onParticipantCreate) {
                      self.onParticipantCreate(self.rosterList[uuid]);
                  } else {
                      if (self.onParticipantUpdate) {
                          self.onParticipantUpdate(self.rosterList[uuid]);
                      }
                      delete self.oldRosterList[uuid];
                  }
              }
              if (self.onParticipantDelete) {
                  for (uuid in self.oldRosterList) {
                      var msg = {'uuid': uuid};
                      self.onParticipantDelete(msg);
                  }
              }
              delete self.oldRosterList;
              if (self.onRosterList) {
                  self.onRosterList(self.getRosterList());
              }
              if (self.onSyncEnd) {
                  self.onSyncEnd();
              }

          }, false);
          self.event_source.addEventListener("call_disconnected", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("call_disconnected", msg);
              if (self.call && self.call.call_uuid == msg.call_uuid) {
                  self.call.remoteDisconnect(msg);
              } else if (self.presentation && self.presentation.call_uuid == msg.call_uuid) {
                  self.presentation.remoteDisconnect(msg);
              } else if (self.screenshare && self.screenshare.call_uuid == msg.call_uuid) {
                  self.screenshare.remoteDisconnect(msg);
              }
          }, false);
          self.event_source.addEventListener("disconnect", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("disconnect", msg);
              var reason = self.trans.ERROR_DISCONNECTED;
              if ('reason' in msg) {
                  reason = msg.reason;
              }
              if (self.state != 'DISCONNECTING') {
                  self.disconnect();
                  if (self.onDisconnect) {
                      self.onDisconnect(reason);
                  }
              }
          }, false);
          self.event_source.addEventListener("conference_update", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("conference_update", msg);
              if (self.onConferenceUpdate) {
                  self.onConferenceUpdate(msg);
              }
          }, false);
          self.event_source.addEventListener("refer", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("refer", msg);
              self.processRefer(msg);
          }, false);
          self.event_source.addEventListener("on_hold", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("call_hold", msg);
              self.holdresume(msg.setting);
          }, false);
          self.event_source.addEventListener("stage", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("stage", msg);
              if (self.onStageUpdate) {
                  self.onStageUpdate(msg);
              }
          }, false);
          self.event_source.addEventListener("layout", function(e) {
              var msg = JSON.parse(e.data);
              self.onLog("layout", msg);
              if (self.onLayoutUpdate) {
                  self.onLayoutUpdate(msg);
              }
          }, false);
          self.event_source.addEventListener("refresh_token", function(e) {
              self.onLog("refresh_token");
              self.refreshToken();
          }, false);
          self.event_source.onopen = function(e) {
              self.onLog("event source open");
              self.event_source_timeout = 10;
          };
          self.event_source.onerror = function(e) {
              self.onLog("event source error", e);
              if (self.state != 'DISCONNECTING') {
                  self.onLog("reconnecting...");
                  self.event_source.close();
                  self.event_source = null;
                  if (self.event_source_timeout > 15000) {
                      self.error = "Error connecting to EventSource";
                      return self.onError(self.trans.ERROR_CONNECTING);
                  }
                  setTimeout(function() {
                      self.createEventSource();
                  }, self.event_source_timeout);
                  self.event_source_timeout += 1000;
              }
          };
      }
  };

  RTCMain.prototype.setConferenceLock = function(setting) {
      var self = this;

      var command = setting ? "lock" : "unlock";
      self.sendRequest(command);
  };

  RTCMain.prototype.sendChatMessage = function(message) {
      var self = this;

      var command = "message";
      var params = {'type': 'text/plain', 'payload': message};

      self.sendRequest(command, params);
  };

  RTCMain.prototype.setMuteAllGuests = function(setting) {
      var self = this;

      var command = setting ? "muteguests" : "unmuteguests";
      self.sendRequest(command);
  };

  RTCMain.prototype.startConference = function() {
      var self = this;

      var command = "start_conference";
      self.sendRequest(command);
  };

  RTCMain.prototype.dialOut = function(destination, protocol, role, cb, user_params) {
      var self = this;

      if (!destination) {
          return;
      }

      var command = "dial";
      var params = {'destination': destination,
                    'protocol': (protocol ? protocol : "sip")};
      var streaming = false;

      if (typeof user_params == "string") {
          // Legacy: is in fact the presentationUri
          params.presentation_uri = user_params;
      } else if (user_params !== null && typeof user_params == "object") {
          if ("call_type" in user_params) {
              params.call_type = user_params.call_type;
          }

          if ("dtmf_sequence" in user_params) {
              params.dtmf_sequence = user_params.dtmf_sequence;
          }

          if ("presentation_uri" in user_params) {
              params.presentation_url = user_params.presentation_uri;
          }

          if ("keep_conference_alive" in user_params) {
              params.keep_conference_alive = user_params.keep_conference_alive;
          }

          if ("remote_display_name" in user_params) {
              params.remote_display_name = user_params.remote_display_name;
          }

          if ("overlay_text" in user_params) {
              params.text = user_params.overlay_text;
          }

          if ("prefer_ipv6" in user_params && user_params.prefer_ipv6) {
              params.prefer_ipv6 = user_params.prefer_ipv6;
          }

          if ("streaming" in user_params) {
              streaming = user_params.streaming;
          }
      }

      if (protocol === 'rtmp' || streaming) {
          params.streaming = 'yes';
      }

      if (role && role.toUpperCase() == "GUEST") {
          params.role = "GUEST";
      }

      if (cb) {
          self.sendRequest(command, params, function(e) {
              var msg;
              try {
                  msg = JSON.parse(e.target.responseText);
              } catch (SyntaxError) {
                  return self.handleError("Unexpected Response: " + e.target.status + " " + e.target.statusText);
              }
              if (e.target.status != 200) {
                  return self.handleError(msg.result || msg.reason);
              }
              cb(msg);
          });
      } else {
          var msg = self.sendRequest(command, params, false);
          return msg;
      }
  };

  RTCMain.prototype.disconnectAll = function() {
      var self = this;

      var command = "disconnect";
      self.sendRequest(command);
  };

  RTCMain.prototype.getParticipants = function(cb) {
      var self = this;

      var command = "participants";
      self.sendRequest(command, {}, cb, "GET");
  };

  RTCMain.prototype.setParticipantMute = function(uuid, setting) {
      var self = this;

      var command = "participants/" + uuid + "/";
      command += setting ? "mute" : "unmute";
      self.sendRequest(command);
  };

  RTCMain.prototype.setParticipantRxPresentation = function(uuid, setting) {
      var self = this;

      var command = "participants/" + uuid + "/";
      command += setting ? "allowrxpresentation" : "denyrxpresentation";
      self.sendRequest(command);
  };

  RTCMain.prototype.unlockParticipant = function(uuid) {
      var self = this;

      var command = "participants/" + uuid + "/unlock";
      self.sendRequest(command);
  };

  RTCMain.prototype.holdParticipant = function(uuid) {
      var self = this;

      var command = "participants/" + uuid + "/hold";
      self.sendRequest(command);
  };

  RTCMain.prototype.resumeParticipant = function(uuid) {
      var self = this;

      var command = "participants/" + uuid + "/resume";
      self.sendRequest(command);
  };

  RTCMain.prototype.disconnectParticipant = function(uuid) {
      var self = this;

      var command = "participants/" + uuid + "/disconnect";
      self.sendRequest(command);
  };

  RTCMain.prototype.transferParticipant = function(uuid, destination, role, pin, cb) {
      var self = this;

      var command = "participants/" + uuid + "/transfer";
      var params = { 'conference_alias': destination };
      if (role) {
          params.role = role;
          if (pin) {
              params.pin = pin;
          }
      }

      if (cb) {
          self.sendRequest(command, params, function(e) {
              if (e.target.status == 200) {
                  var msg = JSON.parse(e.target.responseText);
                  self.onLog(msg);
                  cb(msg.result);
              } else {
                  cb(false);
              }
          });
      } else {
          self.sendRequest(command, params);
      }
  };

  RTCMain.prototype.setParticipantSpotlight = function(uuid, setting) {
      var self = this;

      var command = "participants/" + uuid + "/";
      command += setting ? "spotlighton" : "spotlightoff";
      self.sendRequest(command);
  };

  RTCMain.prototype.overrideLayout = function(new_layout) {
      var self = this;

      var command = "override_layout";
      self.sendRequest(command, new_layout);
  };

  RTCMain.prototype.setParticipantText = function(uuid, text) {
      var self = this;

      var command = "participants/" + uuid + "/overlaytext";
      var params = { 'text': text };
      self.sendRequest(command, params);
  };

  RTCMain.prototype.setRole = function(uuid, role) {
      var self = this;

      if (role !== 'chair' && role !== 'guest') {
          throw new Error("Role must be chair or guest");
      }
      var command = "participants/" + uuid + "/role";
      var params = { 'role': role };
      self.sendRequest(command, params, function() {});
  };

  RTCMain.prototype.handleError = function (err) {
      var self = this;

      if (self.state != 'DISCONNECTING') {
          if (err.hasOwnProperty('message')) {
              self.error = err.message;
          } else {
              self.error = err;
          }
          self.disconnect();
          if (self.onError) {
              if (self.call_type == 'presentation' || self.call_type == 'screen') {
                  self.onError(err);
              } else {
                  if (err.hasOwnProperty('message')) {
                      err = err.message;
                  }
                  self.onError(self.trans.ERROR_CALL_FAILED + err);
              }
          }
      }
  };

  RTCMain.prototype.connect = function(pin, extension) {
      var self = this;

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
          self.requestToken(function () {
              self.createEventSource();
              doConnect();
          });
      } else if (extension) {
          self.conference_extension = extension;
          self.requestToken(function () {
              self.createEventSource();
              self.onSetup(null, self.pin_status);
          });
      } else {
          doConnect();
      }
  };

  RTCMain.prototype.addCall = function(call_type, flash) {

      var self = this;
  console.log("addCall=====",self)
      var obj;
      if (call_type == 'screen_http') {
          obj = new JPEGPresentation();
      } else if (flash || self.call_type == 'rtmp' || self.call_type == 'stream') {
          // obj = new PexRTMP(flash);
      } else if (self.call && !call_type) {
          obj = self.call;
      } else {
          obj = new RTCCall();
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

      console.log("addCall== obj ===",obj)
      return obj;
  };

  RTCMain.prototype.disconnectCall = function(referral) {
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

  RTCMain.prototype.renegotiate = function(call_type) {
      var self = this;

      if (self.call && self.call.update) {
          self.call.update(call_type === undefined ? self.call_type : call_type);
      }
  };

  RTCMain.prototype.clearLocalStream = function() {
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

  RTCMain.prototype.present = function(call_type) {
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

  RTCMain.prototype.muteAudio = function(setting) {
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

  RTCMain.prototype.muteVideo = function(setting) {
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

  RTCMain.prototype.sendDTMFRequest = function(digits, target) {
      var self = this;

      if (target == "call") {
          self.sendRequest('participants/' + self.uuid + '/calls/' + self.call.call_uuid + '/dtmf', { 'digits' : digits }, function() { self.dtmfSent(target); });
      } else {
          self.sendRequest('participants/' + target + '/dtmf', { 'digits' : digits }, function() { self.dtmfSent(target); });
      }
  };

  RTCMain.prototype.sendDTMF = function(digits, target) {
      var self = this;

      target = target || "call";
      if (target == "call" && !self.call) {
          return false;
      }

      if (self.dtmf_queue[target] === undefined) {
          self.dtmf_queue[target] = [];
          self.sendDTMFRequest(digits, target);
      } else {
          self.dtmf_queue[target].push(digits);
      }
  };

  RTCMain.prototype.dtmfSent = function(target) {
      var self = this;

      if (self.dtmf_queue[target].length === 0) {
          delete self.dtmf_queue[target];
      } else {
          self.sendDTMFRequest(self.dtmf_queue[target].shift(), target);
      }
  };

  RTCMain.prototype.sendFECCRequest = function(data, target) {
      var self = this;

      if (target == "call") {
          self.sendRequest('participants/' + self.uuid + '/calls/' + self.call.call_uuid + '/fecc', data, function() { self.feccSent(target); });
      } else {
          self.sendRequest('participants/' + target + '/fecc', data, function() { self.feccSent(target); });
      }
  };

  RTCMain.prototype.sendFECC = function(action, axis, direction, target, timeout) {
      var self = this;

      target = target || "call";
      if (target == "call" && !self.call) {
          return false;
      }

      data = {'action': action, 'movement': [{'axis': axis, 'direction': direction}], 'timeout': timeout};
      if (self.fecc_queue[target] === undefined) {
          self.fecc_queue[target] = [];
          self.sendFECCRequest(data, target);
      } else {
          self.fecc_queue[target].push(data);
      }
  };

  RTCMain.prototype.feccSent = function(target) {
      var self = this;

      if (self.fecc_queue[target].length === 0) {
          delete self.fecc_queue[target];
      } else {
          self.sendFECCRequest(self.fecc_queue[target].shift(), target);
      }
  };

  RTCMain.prototype.holdresume = function(setting) {
      var self = this;

      if (self.call) {
          self.call.holdresume(setting);
      }
      if (self.presentation) {
          self.presentation.holdresume(setting);
      }
      if (self.screenshare) {
          self.screenshare.holdresume(setting);
      }

      if (self.onHoldResume) {
          self.onHoldResume(setting);
      }
  };

  RTCMain.prototype.getRosterList = function() {
      var self = this;

      var roster = [];
      for (var uuid in self.rosterList) {
          roster.push(self.rosterList[uuid]);
      }
      return roster;
  };

  RTCMain.prototype.processRoster = function(msg) {
      var self = this;

      if (self.onRosterList) {
          self.onRosterList(msg.roster);
      }
  };

  RTCMain.prototype.getPresentationURL = function() {
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


  RTCMain.prototype.getPresentation = function() {
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

  RTCMain.prototype.stopPresentation = function() {
      var self = this;

      if (self.presentation) {
          self.presentation.disconnect(false);
          self.presentation = null;
      }
  };


  RTCMain.prototype.processPresentation = function(msg) {
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

  RTCMain.prototype.processRefer = function(msg) {
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

  RTCMain.prototype.disconnect = function(reason, referral) {
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
          self.sendRequest("release_token", params, false);
          self.token = null;
      }
  };

  RTCMain.prototype.sendPresentationImage = function(file) {
      var self = this;
      if (self.screenshare && self.screenshare.sendPresentationImageFile) {
          self.screenshare.sendPresentationImageFile(file);
      }
  };

  RTCMain.prototype.getMediaStatistics = function() {
      var self = this;

      return self.stats.getStats();
  };

  RTCMain.prototype.getVersion = function() {
      var self = this;

      if (self.version) {
          return self.version.version_id + " (" + self.version.pseudo_version + ")";
      } else {
          return "Unknown";
      }
  };

export default RTCMain;
