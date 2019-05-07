
let rtcPort = require('./pexPort').default;
let tool = require('./tool').default;
let RTCStatistics = require('./getRtcStatistics').default;
  /** 建立点对点连接 */
  var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
  var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;

  function Call() {
    var self = this;

    self.state = 'IDLE';
    self.parent = null;
    self.bandwidth_in = 1280;
    self.bandwidth_out = 1280;
    self.localStream = null;
    self.onHold = false;
    self.pc = null;
    self.mutedAudio = false;
    self.mutedVideo = false;
    self.call_type = 'video';
    self.audio_source = null;
    self.video_source = null;
    self.recv_audio = true;
    self.recv_video = true;
    self.force_hd = 720;
    self.event_listener = null;
    self.call_uuid = null;
    self.legacy_screenshare = false;
    self.h264_enabled = true;
    self.allow_1080p = false;
    self.stream = null;
    self.presentation_in_main = false;
    self.ice_candidates = [];
    self.host_candidate = null;

    self.analyser = null;
    self.microphone = null;
    self.audioContext = null;
    self.audioRTCInterval = null;
    self.previousIceConnectionState = '';

    self.stats = RTCStatistics;
    self.stats.parent = self;
    self.stats_interval = null;

    self.onError = null;
    self.onSetup = null;
    self.onConnect = null;
    self.onHoldResume = null;
    self.onDisconnect = null;
    self.onMicActivity = null;
    self.onScreenshareMissing = null;
  }
  /**
   * 同 pexRTC.makeCall()
   * */
  Call.prototype.init = function (parent, params, cb) {
    var self = this;
    self.parent = parent;
    // rtcPort.init(parent, params, null, function () {
    //     if(cb){
    //         cb()
    //     }
    // })
    console.log('call parent ==== ', self.parent)
    // self.makeCall(self.parent.call_type);
  }

  /**
   * 同 pexRTCCall.makeCall()
   * */
  Call.prototype.makeCall = function(parent, call_type) {
    var self = this;
    if (self.state != 'UPDATING') {
      self.state = 'ACTIVE';
    }
    self.parent = parent;
    self.bandwidth_in = self.parent.bandwidth_in;
    self.bandwidth_out = self.parent.bandwidth_out;
    if (self.parent.set_bandwidth_in < self.bandwidth_in) {
          self.bandwidth_in = self.parent.set_bandwidth_in;
    }
    if (self.parent.set_bandwidth_out < self.bandwidth_out) {
          self.bandwidth_out = self.parent.set_bandwidth_out;
    }
    self.presentation_in_main = self.parent.presentation_in_main;
    self.legacy_screenshare = self.parent.screenshare_api === null;
    self.is_android = self.parent.is_android;
    self.firefox_ver = self.parent.firefox_ver;
    self.chrome_ver = self.parent.chrome_ver;
    self.edge_ver = self.parent.edge_ver;
    self.safari_ver = self.parent.safari_ver;
    self.h264_enabled = self.parent.h264_enabled;
    self.allow_1080p = self.parent.allow_1080p;
    if (self.allow_1080p) {
        self.force_hd = 1080;
    } else if (self.force_hd !== false) {
        self.force_hd = 720;
    }

    if (call_type == 'presentation') {
      self.call_type = call_type;
      self.audio_source = false;
      self.video_source = false;
      self.recv_audio = false;
    } else if (call_type == 'audioonly') {
      self.audio_source = self.parent.audio_source;
      self.recv_audio = self.parent.recv_audio;
      self.video_source = false;
      self.recv_video = false;
    } else if (call_type && call_type.indexOf('recvonly') === 0) {
      self.audio_source = false;
      self.video_source = false;
      if (call_type == 'recvonlyvideo') {
          self.recv_audio = false;
      }
    } else if (call_type == 'screen') {
      self.call_type = call_type;
      self.audio_source = false;
      self.recv_audio = false;
      self.recv_video = false;
      if (self.bandwidth_out < 384) {
          // Chrome does not support screensharing at under 384kbps
          self.bandwidth_out = 384;
      }
    } else {
      self.audio_source = self.parent.audio_source;
      self.video_source = self.parent.video_source;
      self.recv_audio = self.parent.recv_audio;
      self.recv_video = self.parent.recv_video;
    }

    // if(self.video_source) {
    //     self.getMedia(self.video_source);
    // }else{
    //     self.getMedia();
    // }
    self.getMedia();
    console.log('call self ==== ', self)
  }

  Call.prototype.connect = function () {
      var self = this;

      if (self.state != 'UPDATING') {
          if ('iceServers' in self.parent.pcConfig) {
              self.pc = new RTCPeerConnection(self.parent.pcConfig);
          } else {
              self.pc = new RTCPeerConnection(null);
          }
      }
      self.pc.onicecandidate = function(evt) { self.pcIceCandidate(evt); };
      self.pc.oniceconnectionstatechange = function(evt) { self.pcIceConnectionStateChanged(evt); };
      if (self.firefox_ver > 52 || self.safari_ver > 603) {
          self.pc.ontrack = function(evt) { self.pcAddStream(evt.streams); }
      } else {
          self.pc.onaddstream = function(evt) { self.pcAddStream([evt.stream]); };
      }

      if (self.call_type == 'screen') {
        var screenshareEnded = function() {
            self.disconnect();
            self.onDisconnect('Presentation ended');
        };
        if (self.chrome_ver > 34 && self.chrome_ver < 50) {
            self.localStream.onended = screenshareEnded;
        } else {
            self.localStream.oninactive = screenshareEnded;
        }
      }

      if (self.localStream) {
          if (self.state == 'UPDATING' && (self.firefox_ver > 58)) {
              self.pc.getSenders()[0].replaceTrack(self.localStream.getTracks()[0]);
              self.pc.getSenders()[1].replaceTrack(self.localStream.getTracks()[1]);
              return self.ackReceived();
          } else if (self.pc.addStream) {
              self.pc.addStream(self.localStream);
          } else if (self.pc.addTrack) {
              var tracks = self.localStream.getTracks();
              for (var i=0;i<tracks.length;i++) {
                  self.pc.addTrack(tracks[i], self.localStream);
              }
          }
      }
      if (self.mutedAudio) {
          self.mutedAudio = false;
          self.muteAudio(true);
      }
      if (self.mutedVideo) {
          self.mutedVideo = false;
          self.muteVideo(true);
      }

      if (self.parent.event_newPC) {
        self.parent.event_newPC(self.pc, self.parent.uuid, self.parent.conference, self.call_type, function() { self.pcCreateOffer(); });
      }

      self.pcCreateOffer();

    //   var pollMediaStatistics = function(){
    //     self.pc.getStats(function (rawStats) {
    //       self.stats.updateStats(rawStats.result());
    //     }, function(err){
    //       console.error(err);
    //     })
    //   }
    //   self.stats_interval = setInterval(() => {
    //     pollMediaStatistics()
    //   }, 1000);
      
  }
  Call.prototype.getMedia = function(sourceId) {
    var self = this;
    if(sourceId) {
      self.video_source = sourceId;
    }

    if(self.localStream) {
      if (self.parent.return_media_stream) {
          return self.onSetup(self.localStream);
      } else {
          var url = window.URL || window.webkitURL || window.mozURL;
          return self.onSetup(url.createObjectURL(self.localStream));
      }
    }

    if (!self.localStream && !(self.audio_source === false && self.video_source === false)) {
      var audioConstraints = self.audio_source !== false;
      var videoConstraints = {};
      if (self.call_type == 'screen') {
          if (self.video_source) {
              videoConstraints.chromeMediaSource = 'desktop';
              videoConstraints.chromeMediaSourceId = self.video_source;
          } else {
              if (self.firefox_ver > 32) {
                  videoConstraints.mozMediaSource = self.call_type;
                  videoConstraints.mediaSource = self.call_type;
              } else {
                  videoConstraints.chromeMediaSource = self.call_type;
                  if (self.chrome_ver < 50) {
                      videoConstraints.googLeakyBucket = true;
                  }
              }
          }
          videoConstraints.maxWidth = self.parent.screenshare_width;
          videoConstraints.maxHeight = self.parent.screenshare_height;
          videoConstraints.maxFrameRate = self.parent.screenshare_fps.toString();
      } else if (self.firefox_ver > 43 || self.edge_ver > 10527) {
          videoConstraints.frameRate = {'ideal': 30, 'max': 30};
          if (self.force_hd > 0 && navigator.userAgent.indexOf('OS X') != -1) {
              videoConstraints.width = {'min': 1280};
              videoConstraints.height = {'min': 720};
              if (self.force_hd == 1080) {
                  videoConstraints.width.ideal = 1920;
                  videoConstraints.height.ideal = 1080;
              }
          } else {
              videoConstraints.width = {'ideal': 1280};
              videoConstraints.height = {'ideal': 720};
              if (self.force_hd == 1080) {
                  videoConstraints.width.max = 1920;
                  videoConstraints.height.max = 1080;
              }
          }
      } else if (self.chrome_ver > 56 && !self.is_android) {
          if (self.force_hd == 1080) {
              videoConstraints.width = {'min': 1920};
              videoConstraints.height = {'min': 1080};
              videoConstraints.frameRate = {'ideal': 30, 'max': 30};
          } else if (self.force_hd == 720) {
              videoConstraints.width = {'min': 1280};
              videoConstraints.height = {'min': 720};
              videoConstraints.frameRate = {'ideal': 30, 'max': 30};
          } else {
              videoConstraints.width = {'ideal': 1280};
              videoConstraints.height = {'ideal': 720};
          }
      } else if (self.safari_ver > 603) {
          if (self.force_hd == 1080) {
              videoConstraints.width = 1920;
              videoConstraints.height = 1080;
          } else if (self.force_hd == 720) {
              videoConstraints.width = 1280;
              videoConstraints.height = 720;
          }
      } else if (self.force_hd == 1080 && self.chrome_ver >= 34) {
          videoConstraints.minWidth = "1920";
          videoConstraints.minHeight = "1080";
      } else if (self.force_hd == 720) {
          videoConstraints.minWidth = "1280";
          videoConstraints.minHeight = "720";
      }

      if (self.chrome_ver >= 38 && self.chrome_ver < 49 && self.bandwidth_out > 384) {
          videoConstraints.googHighBitrate = true;
          if (self.bandwidth_out > 960) {
              videoConstraints.googVeryHighBitrate = true;
          }
      }

      if (self.audio_source && audioConstraints) {
        if ((self.chrome_ver > 56 && self.chrome_ver < 66 && !self.is_android) || self.firefox_ver > 43 || self.edge_ver > 10527) {
            audioConstraints = {'deviceId': self.audio_source};
        } else if (self.safari_ver > 603 || self.chrome_ver > 65) {
            audioConstraints = {'deviceId': {'exact': self.audio_source}};
        } else if (self.chrome_ver > 49) {
            audioConstraints = {'mandatory': {'sourceId': self.audio_source}, 'optional': []};
        } else {
            audioConstraints = {'optional': [{'sourceId': self.audio_source}]};
        }
      }
    //   if (self.audio_source && audioConstraints) {
    //     if ((self.chrome_ver > 56 && !self.is_android) || self.firefox_ver > 43 || self.edge_ver > 10527 || self.safari_ver > 603) {
    //         audioConstraints = {'deviceId': self.audio_source};
    //     } else if (self.chrome_ver > 49) {
    //         audioConstraints = {'mandatory': {'sourceId': self.audio_source}, 'optional': []};
    //     } else {
    //         audioConstraints = {'optional': [{'sourceId': self.audio_source}]};
    //     }
    // }

      if (self.chrome_ver >= 38 && self.chrome_ver < 57) {
          if (audioConstraints && !audioConstraints.optional) {
              audioConstraints = {'optional': []};
          }
          if (audioConstraints) {
              audioConstraints.optional.push({'googEchoCancellation': true});
              audioConstraints.optional.push({'googEchoCancellation2': true});
              audioConstraints.optional.push({'googAutoGainControl': true});
              audioConstraints.optional.push({'googAutoGainControl2': true});
              audioConstraints.optional.push({'googNoiseSuppression': true});
              audioConstraints.optional.push({'googNoiseSuppression2': true});
              audioConstraints.optional.push({'googHighpassFilter': true});
          }
      } else if (self.chrome_ver >= 57 && self.chrome_ver < 63) {
          if (audioConstraints === true) {
              audioConstraints = {'deviceId': 'default'};
          }
          if (audioConstraints) {
              audioConstraints['googEchoCancellation'] = true;
              audioConstraints['googExperimentalEchoCancellation'] = true;
              audioConstraints['googAutoGainControl'] = true;
              audioConstraints['googExperimentalAutoGainControl'] = true;
              audioConstraints['googNoiseSuppression'] = true;
              audioConstraints['googExperimentalNoiseSuppression'] = true;
              audioConstraints['googHighpassFilter'] = true;
              audioConstraints['googAudioMirroring'] = false;
          }
      }

      var constraints = { 'audio' : audioConstraints };

      if ((self.chrome_ver > 56 && self.call_type != 'screen' && !self.is_android) || self.firefox_ver > 32 || self.edge_ver > 10527 || self.safari_ver > 603) {
          constraints.video = videoConstraints;
      } else {
          constraints.video = { 'mandatory' : videoConstraints, 'optional' : [] };
      }

      if (self.video_source && self.call_type != 'screen') {
          if ((self.chrome_ver > 56 && self.chrome_ver < 66 && !self.is_android) || self.firefox_ver > 43 || self.edge_ver > 10527) {
              constraints.video.deviceId = self.video_source;
          } else if (self.safari_ver > 603 || (self.chrome_ver > 65 && !self.is_android)) {
              constraints.video.deviceId = {'exact': self.video_source};
          } else if (self.chrome_ver > 49) {
              constraints.video.mandatory.sourceId = self.video_source;
          } else {
              constraints.video.optional = [{'sourceId': self.video_source}];
          }
      }
        // if (self.video_source && self.call_type != 'screen') {
        //     if ((self.chrome_ver > 56 && !self.is_android) || self.firefox_ver > 43 || self.edge_ver > 10527 || self.safari_ver > 603) {
        //         constraints.video.deviceId = self.video_source;
        //     } else if (self.chrome_ver > 49) {
        //         constraints.video.mandatory.sourceId = self.video_source;
        //     } else {
        //         constraints.video.optional = [{'sourceId': self.video_source}];
        //     }
        // }

      if (self.chrome_ver > 49 && self.chrome_ver < 57 && !self.call_type && self.parent.powerLineFrequency > 0) {
          constraints.video.optional.push({'googPowerLineFrequency': self.parent.powerLineFrequency});
      }

      if (self.video_source === false) {
          constraints.video = false;
      }

      console.log("constraints===", constraints);
      // getUserMedia(constraints)
      navigator.getMedia = ( navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia);

      try {
          if (self.call_type !== 'screen' && self.parent && self.parent.user_media_stream) {
              self.gumSuccess(self.parent.user_media_stream);
          } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia(constraints)
                                                  .then(function(stream) { self.gumSuccess(stream); })
                                                  .catch(function(err) { self.gumError(err); });
          } else if (navigator.getMedia) {
              navigator.getMedia(constraints,
                                 function(stream) { self.gumSuccess(stream); },
                                 function(err) { self.gumError(err); });
          } else {
              return false; // self.handleError(self.parent.trans.ERROR_WEBRTC_SUPPORT);
          }
      } catch (error) {
          self.gumError(error);
      }
    }
    // else {
    //     self.onSetup();
    // }

  }
  Call.prototype.gumSuccess = function(stream) {
    var self = this;
    self.localStream = stream;
    tool.init('localVideo', self.localStream);
    console.log('----localVideo----', self.localStream)

    if (self.parent.return_media_stream) {
      self.onSetup(stream);
    } else {
      var url = window.URL || window.webkitURL || window.mozURL;
      self.onSetup(url.createObjectURL(stream));
    }

    var audioCtx = (window.AudioContext || window.webkitAudioContext || undefined);
    if (self.audio_source !== false && audioCtx !== undefined && audioCtx.prototype.createMediaStreamSource) {
        if (!self.audioContext) {
            self.audioContext = new audioCtx();
        }
        if (self.audioContext.resume) {
            self.audioContext.resume();
        }

        if (!self.analyser) {
            self.analyser = self.audioContext.createAnalyser();
        }
        self.microphone = self.audioContext.createMediaStreamSource(stream);

        self.analyser.smoothingTimeConstant = 0.1;
        self.analyser.fftSize = 512;
        self.microphone.connect(self.analyser);

        var audioProcess = function() {
            var array =  new Uint8Array(self.analyser.frequencyBinCount);
            self.analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += array[i];
            }

            var average = values / length;
            if (average > 70) {
                if (self.onMicActivity !== null) {
                    self.onMicActivity();
                }
            }
        };
        self.audioRTCInterval = setInterval(audioProcess, 250);
    }
  }
  Call.prototype.gumError = function(err) {
    var self = this;
    console.error('getUserMedia error ===>', err)
    if(self.call_type == 'screen') {
        self.cleanup();
        if (self.chrome_ver >= 34) {
            if (err && err.name == 'TrackStartError') {
                // self.handleError(self.parent.trans.ERROR_CONNECTING_SCREENSHARE);
            } else {
                self.onScreenshareMissing();
            }
        } else {
            // self.handleError(self.parent.trans.ERROR_SCREENSHARE_CANCELLED);
        }
    } else if(self.force_hd == 1080) {
        self.force_hd = 720;
        return self.getMedia();
    } else if(self.force_hd == 720) {
        self.force_hd = 0;
        return self.getMedia();
    } else {
        if (self.parent.event_error) {
            self.parent.event_error(self.pc, self.parent.conference, 'getUserMedia', err);
        }
        console.log('getUserMedia err 2')
    }
  }
  Call.prototype.changeDevices = function() {
      var self = this;
      self.localStream = null;
      self.makeCall(self.parent.call_type)
  }
  Call.prototype.peerInit = function(pcConfig){
      var self = this;
      self.pc = new RTCPeerConnection(pcConfig);
      self.pc.onicecandidate = function(evt) { self.pcIceCandidate(evt) };
      if (self.parent.firefox_ver > 52 || self.parent.safari_ver > 603) {
        self.pc.ontrack = function(evt) { self.pcAddStream(evt.streams); }
      } else {
          self.pc.onaddstream = function(evt) { self.pcAddStream([evt.stream]); };
      }
      return new RTCPeerConnection(pcConfig);
    }
  Call.prototype.pcCreateOffer = function() {
        var self = this;
        var constraints = {};
        if (self.parent.chrome_ver > 49 || self.parent.firefox_ver > 42 || self.parent.edge_ver > 10527 || self.parent.safari_ver > 603) {
            constraints =  { 'offerToReceiveAudio': self.parent.recv_audio, 'offerToReceiveVideo': self.parent.recv_video };
        } else {
            constraints =  { 'mandatory': { 'OfferToReceiveAudio': self.parent.recv_audio, 'OfferToReceiveVideo': self.parent.recv_video } };
        }

        setTimeout(function() {
            if (self.state == 'ACTIVE') {
                self.state = 'CONNECTING';
                console.log("Timed out gathering candidates", self.pc.localDescription.sdp);
                if (self.ice_candidates.length == 0) {
                    console.log("No ICE candidates were gathered.");
                    // self.handleError(self.parent.trans.ERROR_ICE_CANDIDATES);
                } else {
                    self.pcOfferCreated(self.pc.localDescription);
                }
            }
        }, 10000);
        
        if(self.parent.safari_ver > 604) {
            self.pc.createOffer(constraints)
                .then(function(sdp) {
                    self.pcOfferCreated(sdp);
                })
                .catch(function(err) {
                    console.error('createOffer error')
                });
        }else {
            self.pc.createOffer(function(sdp) {
                console.log('createOffer success 446')
                self.pcOfferCreated(sdp)
            },
            function(err) {
                console.error('createOffer error')
            },
            constraints);
        }
    }
  Call.prototype.pcOfferCreated = function(sdp) {
      var self = this;
      console.log("Created offer", sdp.sdp);
      self.pc.setLocalDescription(sdp,
        function () { console.log("Local description active"); },
        function (err) {
          console.error('Local description failed')
        }
      );
      if (self.state == 'CONNECTING' || self.state == 'UPDATING') {
        var mutatedOffer = {'call_type' : 'WEBRTC', 'sdp' : self.mutateOffer(sdp).sdp};
        if (self.parent.call_type == 'screen') {
            mutatedOffer.present = 'send';
        } else if (self.parent.call_type == 'presentation') {
            mutatedOffer.present = 'receive';
        } else if (self.parent.presentation_in_main) {
            mutatedOffer.present = 'main';
        }
      
        rtcPort.Call_calls(self.state, mutatedOffer, function(e){
            self.processAnswer(e)
        })
    }
    //   if(cb){
    //     cb(self.mutateOffer(sdp).sdp);
    //   }
    }

  Call.prototype.processAnswer = function(e, cb){
    var self = this;
    var msg;
    try {
        msg = JSON.parse(e.target.responseText);
    } catch (SyntaxError) {
        return console.error("Unexpected Response: " + e.target.status + " " + e.target.statusText);
    }
    if (e.target.status != 200) {
    return console.error(msg.result || msg.reason);
    }
    console.log("Received answer", msg.result);
    if (msg.result.call_uuid) {
    self.parent.call_uuid = msg.result.call_uuid;
    }

    if(self.state != 'DISCONNECTING') {
    var lines;
    if (msg.result.sdp) {
        lines = msg.result.sdp.split('\r\n');
    } else {
        lines = msg.result.split('\r\n');
    }
    lines = self.sdpChangeBW(lines);
    var sdp = lines.join('\r\n');
    console.log("Mutated answer", sdp);

    if(self.parent.safari_ver > 604) {
        self.pc.setRemoteDescription(new RTCSessionDescription({'type': 'answer', 'sdp' : sdp}))
        .then(function () {
            console.log('setRemoteDescription success safari');
            self.remoteDescriptionActive();
        })
        .catch(function (err) {
            console.error('Remote description failed safari')
        })
    } else {
        self.pc.setRemoteDescription(new RTCSessionDescription({ 'type' : 'answer', 'sdp' : sdp }),
        function () {
            if (self.parent.edge_ver > 10527 && self.parent.edge_ver <= 14393) {
                self.sdpIceCandidates(sdp);
            }
            self.remoteDescriptionActive();
            console.log('setRemoteDescription success');
        },
        function (err) {
            console.error('Remote description failed')
        });
        }
    }
  }

  Call.prototype.remoteDescriptionActive = function () {
    var self = this;
    console.log('Remote description active');
    if (self.recv_audio === false && self.recv_video === false && self.chrome_ver > 47 && self.localStream) {
        self.pcAddStream([self.localStream]);
    }
    rtcPort.Call_ack(function() {
        self.ackReceived()
    })
  }
    // 处理sdp
  Call.prototype.sdpChangeBW = function(sdplines) {
        var self = this;
        var state = 'notinvideo';
        var newlines = [];

        for (var i = 0; i < sdplines.length; i++) {
            newlines.push(sdplines[i]);
            if (sdplines[i].lastIndexOf('m=video', 0) === 0) {
                state = 'invideo';
            } else if (state === 'invideo') {
                if (sdplines[i].lastIndexOf('c=', 0) === 0) {
                    if (sdplines[i+1].lastIndexOf('b=AS:', 0) === 0) {
                        var oldbw = sdplines[i+1];
                        oldbw = oldbw.substr(oldbw.indexOf(":")+1);
                        if (parseInt(oldbw) < self.parent.bandwidth_out) {
                            self.parent.bandwidth_out = oldbw;
                        }
                        i++;
                    }
                    if (sdplines[i+1].lastIndexOf('b=TIAS:', 0) === 0) {
                        i++;
                    }
                    newlines.push('b=AS:' + self.parent.bandwidth_out);
                    newlines.push('b=TIAS:' + (self.parent.bandwidth_out * 1000));
                } else if (sdplines[i].lastIndexOf('m=', 0) === 0 || sdplines[i] === '') {
                    if (sdplines[i].lastIndexOf('m=video', 0) !== 0) {
                        state = 'notinvideo';
                    }
                }
            }
            if (navigator.userAgent.indexOf("Chrome") != -1 && sdplines[i].lastIndexOf('a=sendonly', 0) === 0) {
                newlines.push('a=sendrecv');
            }
        }
        return newlines;
    };
  Call.prototype.sdpIceCandidates = function() {
      var self = this;
      var mLine = -1;
      var candidate;
      var sdplines = sdp.split('\r\n');
      for (var i = 0; i < sdplines.length; i++) {
          if (sdplines[i].lastIndexOf('a=candidate', 0) === 0) {
              candidate = {'sdpMLineIndex' : mLine, 'candidate' : sdplines[i].substr(2)};
              self.pc.addIceCandidate(candidate);
          } else if (sdplines[i].lastIndexOf('m=', 0) === 0 || sdplines[i] === '') {
              if (mLine > -1) {
                  candidate = {'sdpMLineIndex' : mLine, 'candidate' : 'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates'};
                  self.pc.addIceCandidate(candidate);
              }
              mLine++;
          }
      }
    };
   Call.prototype.mutateOffer = function(description) {
      var self = this;
      var lines = description.sdp.split('\r\n');
      if (self.parent.edge_ver > 10527) {
          lines = self.sdpAddCandidates(lines);
      }
      lines = self.sdpAddPLI(lines);

      var sdp = lines.join('\r\n');
      console.log("Mutated offer", sdp);

      return new RTCSessionDescription({ 'type' : 'offer', 'sdp' : sdp });
    }
  Call.prototype.sdpAddCandidates = function(sdplines) {
      var self = this;
      var newlines = [];

      for (var i = 0; i < sdplines.length; i++) {
          if (self.parent.edge_ver < 14393 && (sdplines[i].lastIndexOf('m=', 0) === 0 || sdplines[i] === '')) {
              for (var j = 0; j < self.ice_candidates.length; j++) {
                  if (self.ice_candidates[j].indexOf("endOfCandidates") === -1) {
                      newlines.push('a=' + self.ice_candidates[j]);
                  }
              }
          }
          newlines.push(sdplines[i]);

          if (sdplines[i].indexOf('a=ssrc:') === 0 && sdplines[i].indexOf('cname:') > 0) {
              var ssrc = sdplines[i].substr(7, sdplines[i].indexOf(" ")-7);
              newlines.push('a=x-ssrc-range:' + ssrc + '-' + (parseInt(ssrc)+99));
          }
      }

      return newlines;
    };

  Call.prototype.sdpAddPLI = function(sdplines) {
      var self = this;
      var state = 'notinvideo';
      var newlines = [];

      for (var i = 0; i < sdplines.length; i++) {
          var sdpline = sdplines[i];

          if (sdplines[i].lastIndexOf('c=', 0) === 0 && (sdplines[i].substr(-7) == '0.0.0.0')) {
              var host = self.getHostCandidate(sdplines, i);
              if (host) {
                  if (host[0].indexOf(':') > -1) {
                      sdpline = 'c=IN IP6 ' + host[0];
                  } else {
                      sdpline = 'c=IN IP4 ' + host[0];
                  }
              }
          } else if (sdplines[i].lastIndexOf('m=', 0) === 0 && (sdplines[i].split(' ')[1] == '9')) {
              var fields = sdplines[i].split(' ');
              var host = self.getHostCandidate(sdplines, i, fields[1]) || self.getHostCandidate(sdplines, i);
              if (host) {
                  fields[1] = host[1];
                  sdpline = fields.join(' ');
              }
          }

          if (state === 'notinvideo') {
              newlines.push(sdpline);

              if (sdplines[i].lastIndexOf('m=video', 0) === 0) {
                  state = 'invideo';
              }
          } else if (state === 'invideo') {
              if (sdplines[i].lastIndexOf('m=', 0) === 0 || sdplines[i] === '') {
                  if (!(self.parent.chrome_ver > 41 || self.parent.firefox_ver > 44)) {
                      newlines.push('a=rtcp-fb:* nack pli');
                  }

                  if (self.parent.call_type == 'presentation' || self.parent.call_type == 'screen') {
                      newlines.push('a=content:slides');
                  }

                  if (sdplines[i].lastIndexOf('m=video', 0) !== 0) {
                      state = 'notinvideo';
                  }
              }

              if ((!self.parent.h264_enabled || self.parent.call_type == 'screen') && sdplines[i].lastIndexOf('a=rtpmap:', 0) === 0 && sdplines[i].lastIndexOf('H264') > 0) {
                  var fields = sdplines[i].split(' ');
                  var pt = fields[0].substr(fields[0].indexOf(':')+1);
                  while (sdplines[i+1].lastIndexOf('a=fmtp:' + pt, 0) === 0 || sdplines[i+1].lastIndexOf('a=rtcp-fb:' + pt, 0) === 0) {
                      i++;
                  }
                  continue;
              }

              newlines.push(sdpline);

              if (self.parent.chrome_ver > 0 && (self.parent.allow_1080p || self.parent.call_type == 'presentation') && sdplines[i].lastIndexOf('a=rtpmap:', 0) === 0) {
                  var fields = sdplines[i].split(' ');
                  var pt = fields[0].substr(fields[0].indexOf(':')+1);
                  if (sdplines[i].lastIndexOf('VP8') > 0) {
                      newlines.push('a=fmtp:' + pt + ' max-fs=8160;max-fr=30');
                  } else if (sdplines[i].lastIndexOf('H264') > 0) {
                      while (sdplines[i+1].lastIndexOf('a=rtcp-fb:' + pt, 0) === 0) {
                          newlines.push(sdplines[++i]);
                      }
                      if (sdplines[i+1].lastIndexOf('a=fmtp:' + pt, 0) === 0 && sdplines[i+1].lastIndexOf('max-fs') === -1) {
                          newlines.push(sdplines[++i] + ';max-br=3732;max-mbps=245760;max-fs=8192;max-smbps=245760;max-fps=3000;max-fr=30');
                      }
                  }
              }

              if (sdplines[i].lastIndexOf('c=', 0) === 0) {
                  newlines.push('b=AS:' + self.parent.bandwidth_in);
              }
          }
      }

      return newlines;
    };
  Call.prototype.getHostCandidate = function(sdplines, start, port) {
      var self = this;

      var candidates = [];
      for (var i = start; i < sdplines.length; i++) {
          if (sdplines[i].lastIndexOf('a=candidate', 0) === 0 && sdplines[i].substr(-4) == 'host') {
              var fields = sdplines[i].split(' ');
              if (port && fields[5] != port) {
                  continue;
              }
              candidates.push(fields[4] + ',' + fields[5]);
          }
      }

      if (candidates.length > 0) {
          if (self.parent.host_candidate == null || !candidates.includes(self.parent.host_candidate)) {
              // Prefer IPv4
              for (var i = 0; i < candidates.length; i++) {
                  if (candidates[i].indexOf(':') == -1) {
                      self.parent.host_candidate = candidates[i];
                      break;
                  }
              }

              if (self.parent.host_candidate == null) {
                  self.parent.host_candidate = candidates[0];
              }
          }

          return self.parent.host_candidate.split(',');
      }
    };

  Call.prototype.pcIceCandidate = function (evt) {
      var self = this;

      // Do not gather candidates again
      if (self.state == 'UPDATING') {
          return;
      }

      console.log("Ice Gathering State", self.pc.iceGatheringState);
      if (evt.candidate) {
          console.log("Gathered ICE candidate", evt.candidate.candidate);
          self.ice_candidates.push(evt.candidate.candidate);
      } else if (self.pc.iceGatheringState == "complete") {
          if (self.state == 'ACTIVE') {
              self.state = 'CONNECTING';
              console.log("Finished gathering candidates", self.pc.localDescription.sdp);
              if (self.ice_candidates.length == 0) {
                  console.error('No ICE candidates were gathered. 774')
              } else {
                  setTimeout(function() {
                    console.log('createOffer success 763')
                    self.pcOfferCreated(self.pc.localDescription);
                  }, 200);
              }
          }
      }
    };

  Call.prototype.pcIceConnectionStateChanged = function (evt) {
      var self = this;

      console.log("Ice Connection State", self.pc.iceConnectionState);
      if (self.pc.iceConnectionState == 'failed' && self.state == 'CONNECTED') {
          if (self.previousIceConnectionState == 'checking') {
              self.parent.error = "ICE Failed at start of call.";
              self.disconnect();
              // self.onError(self.parent.trans.ERROR_ICE_FAILED);
          } else if (self.chrome_ver > 0) {
              self.parent.error = "ICE Failed mid-call.";
              self.disconnect();
              // self.onError(self.parent.trans.ERROR_CONNECTING);
          }
      }
      self.previousIceConnectionState = self.pc.iceConnectionState;
  };
  Call.prototype.pcAddStream = function(streams) {
    var self = this;

    for (var i = 0; i < streams.length; i++) {
        console.log("Stream added", streams[i].id);
        if (self.parent.recv_audio === false && self.parent.recv_video === false && self.parent.localStream) {
            self.parent.stream = self.parent.localStream;
        } else {
            self.parent.stream = streams[i];
        }
        if (self.state == 'CONNECTED' || self.state == 'UPDATING') {
            if (self.parent.return_media_stream) {
                self.parent.onConnect(self.parent.stream, self.parent.call_uuid);
                // self.onConnect(self.parent.stream, self.parent.call_uuid);
                // console.log('onConnect')
            } else {
                var url = window.URL || window.webkitURL || window.mozURL;
                self.parent.onConnect(url.createObjectURL(self.parent.stream), self.parent.call_uuid);
                // self.onConnect(url.createObjectURL(self.parent.stream), self.parent.call_uuid);
                // console.log('onConnect')
            }
        }
        self.state = 'CONNECTED';
    }
  };

  Call.prototype.ackReceived = function () {
      var self = this;
      if (self.parent.firefox_ver > 43 && self.parent.call_type == 'screen' && !self.parent.stream) {
          // Firefox does not add a stream/track for outbound screensharing
          self.parent.onConnect(null, self.parent.call_uuid);
        //   self.onConnect(null, self.parent.call_uuid);
      } else if (self.state == 'CONNECTED' || self.state == 'UPDATING') {
          if (self.parent.return_media_stream) {
            self.parent.onConnect(self.parent.stream, self.parent.call_uuid);
            // self.onConnect(self.parent.stream, self.parent.call_uuid);
          } else {
              var url = window.URL || window.webkitURL || window.mozURL;
              self.parent.onConnect(url.createObjectURL(self.parent.stream), self.parent.call_uuid);
            // self.onConnect(url.createObjectURL(self.parent.stream), self.parent.call_uuid);
          }
      }
      self.state = 'CONNECTED';
  }

  Call.prototype.disconnect = function (cb) {
    var self = this;
    if(self.state != 'DISCONNECTING'){
        self.state = 'DISCONNECTING';
        rtcPort.Call_disconnect(cb);
        rtcPort.releaseToken(self.parent.token)
        tool.init('localVideo', null)
        tool.init('remoteVideo', null)
    }
  }

  Call.prototype.muteVideo = function (setting) {
    var self = this;
    if(setting === self.mutedVideo) {
        return self.mutedVideo;
    }
    if(self.pc && (self.firefox_ver > 47 || self.safari_ver > 604)) {
        var senders = self.pc.getSenders();
        for (var i=0; i<senders.length; i++) {
            if (senders[i].track.kind == 'video') {
                senders[i].track.enabled = self.mutedVideo;
            }
        }
    } else {
        var streams = [];
        if (self.pc) {
            streams = self.pc.getLocalStreams();
        } else if (self.localStream) {
            streams = [self.localStream];
        }

        for (var i=0; i<streams.length; i++) {
            var tracks = streams[i].getVideoTracks();
            for (var j=0; j<tracks.length; j++) {
                tracks[j].enabled = self.mutedVideo;
            }
        }
    }

    self.mutedVideo = !self.mutedVideo;
    return self.mutedVideo;
  }

  Call.prototype.muteAudio = function(setting) {
    var self = this;
    if (setting === self.mutedAudio) {
        return self.mutedAudio;
    }
    if (self.pc && (self.firefox_ver > 47 || self.safari_ver > 604)) {
        var senders = self.pc.getSenders();
        for (var i=0; i<senders.length; i++) {
            if (senders[i].track.kind == 'audio') {
                senders[i].track.enabled = self.mutedAudio;
            }
        }
    } else {
        var streams = [];
        if (self.pc) {
            streams = self.pc.getLocalStreams();
        } else if (self.localStream) {
            streams = [self.localStream];
        }

        for (var i=0; i<streams.length; i++) {
            var tracks = streams[i].getAudioTracks();
            for (var j=0; j<tracks.length; j++) {
                tracks[j].enabled = self.mutedAudio;
            }
        }
    }
    self.mutedAudio = !self.mutedAudio;

    return self.mutedAudio;
  }

  Call.prototype.getMediaStatistics = function() {
    var self = this;
    return self.stats.getStats();
  }

  Call.prototype.cleanup = function () {
    var self = this;
    if (self.localStream) {
        console.log("Releasing user media");
        if (self.call_type === 'screen' || (self.parent && !self.parent.user_media_stream)) {
            var tracks = self.localStream.getTracks();
            for (var i=0;i<tracks.length;i++) {
                tracks[i].stop();
            }
        }
        self.localStream = null;
    }
    if (self.pc && self.pc.signalingState != 'closed') {
        self.pc.close();
    }
  }

  Call.prototype.remoteDisconnect = function (msg) {
    var self = this;
    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        self.cleanup();
        var reason;
        if (self.call_type == 'presentation') {
            // reason = self.parent.trans.ERROR_DISCONNECTED_PRESENTATION;
            reason = 'Presentation stream remotely disconnected';
            if ('reason' in msg) {
                reason += ": " + msg.reason;
            }
        } else if (self.call_type == 'screen') {
            // reason = self.parent.trans.ERROR_DISCONNECTED_SCREENSHARE;
            reason = 'Screenshare remotely disconnected';
            if ('reason' in msg) {
                reason += ": " + msg.reason;
            }
        } else if ('reason' in msg) {
            reason = msg.reason;
        } else {
            // reason = self.parent.trans.ERROR_DISCONNECTED;
            reason = 'You have been remotely disconnected from this conference';
        }

        self.onDisconnect(reason);
    }
  }

  Call.prototype.update = function (call_type) {
    var self = this;

    if (self.state == 'CONNECTED') {
        self.state = 'UPDATING';
        self.cleanupAudioContext();
        if (self.localStream) {
            var tracks = self.localStream.getTracks();
            for (var i=0;i<tracks.length;i++) {
                tracks[i].stop();
                self.localStream.removeTrack(tracks[i]);
            }
            self.localStream = undefined;
            if (self.firefox_ver > 47) {
                var senders = self.pc.getSenders();
                for (var i=0; i<senders.length; i++) {
                    self.pc.removeTrack(senders[i]);
                }
            } else {
                var streams = self.pc.getLocalStreams();
                for (var i=0; i<streams.length; i++) {
                    self.pc.removeStream(streams[i]);
                }
            }
        }
        self.makeCall(self.parent, call_type);
    }
  }

  Call.prototype.holdresume = function(setting) {
    var self = this;

    self.onHold = setting;
    setting = !setting;
    var streams = self.pc.getLocalStreams().concat(self.pc.getRemoteStreams());
    for (var i=0; i<streams.length; i++) {
        var tracks = streams[i].getAudioTracks().concat(streams[i].getVideoTracks());
        for (var j=0; j<tracks.length; j++) {
            tracks[j].enabled = setting;
        }
    }

    if (self.parent.event_event) {
        self.parent.event_event(self.pc, self.parent.conference, self.onHold ? 'fabricHold' : 'fabricResume');
    }

    if (self.mutedAudio) {
        self.mutedAudio = false;
        self.muteAudio();
    }
    if (self.mutedVideo) {
        self.mutedVideo = false;
        self.muteVideo();
    }
};

Call.prototype.cleanupAudioContext = function() {
    var self = this;

    if (self.audioContext && self.microphone && self.analyser) {
        try {
            self.microphone.disconnect(self.analyser);
            if (self.audioRTCInterval) {
                clearInterval(self.audioRTCInterval);
                self.audioRTCInterval = null;
            }
        } catch (e) {
            console.error("Unable to disconnect audio context", e);
        }
    }

    self.analyser = null;
    self.microphone = null;

    if (self.audioContext && self.audioContext.close) {
        self.audioContext.close();
        self.audioContext = null;
    } else if (self.audioContext && self.audioContext.suspend) {
        self.audioContext.suspend();
    }
};

Call.prototype.cleanup = function() {
    var self = this;

    self.cleanupAudioContext();

    if (self.event_listener) {
        window.removeEventListener('message', self.event_listener);
        self.event_listener = null;
    }

    if (self.localStream) {
        self.parent.onLog("Releasing user media");
        if (self.call_type === 'screen' || (self.parent && !self.parent.user_media_stream)) {
            var tracks = self.localStream.getTracks();
            for (var i=0;i<tracks.length;i++) {
                tracks[i].stop();
            }
        }
        self.localStream = null;
    }

    if (self.pc && self.pc.signalingState != 'closed') {
        self.pc.close();
    }

    if (self.parent.event_event) {
        self.parent.event_event(self.pc, self.parent.conference, 'fabricTerminated');
    }
};
export default new Call()
