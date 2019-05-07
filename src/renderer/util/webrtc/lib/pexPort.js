
let eventSource = require('./eventSource').default;
let tool = require('./tool').default;

  function pexPort (){
    var self = this;
    self.parent = {};
  }
  pexPort.prototype.init = function(parent, cb) {
    var self = this;
    self.parent = parent;
    // self.parent.state = 'ACTIVE';
    // self.parent.node = params.host;
    // self.parent.conference_uri = encodeURIComponent(params.conference);
    // self.parent.display_name = params.name;
    // self.parent.call_type = parent.call_type;
    // self.parent.pin = params.pin;
    // self.parent.flash = flash;
    // if (params.bw) {
    //   self.parent.bandwidth_in = parseInt(params.bw);
    //   self.parent.bandwidth_out = self.parent.bandwidth_in;
    // }
    console.log('port parent ====',self.parent)
    self.requestToken(self.parent.token, self.parent.display_name, function(){
      eventSource.init(self.parent);
      if(cb){
        cb()
      }
    })
  }

  /**
   * requestToken
   * @description 获取token
   * @param token
   * @param display_name
   * @param cb
   */
  pexPort.prototype.requestToken = function (token, display_name, cb) {
    var self = this;
    if (!token) {
      var params = { 'display_name': display_name };
      self.sendRequest('request_token', params, function(evt){
        console.log("发送request_token请求");
        self.tokenRequested(evt, cb)
      });
    }else if(cb){
      cb();
    }
  }
  pexPort.prototype.tokenRequested = function(e, cb) {
    var self = this;
    var msg = {};
    try {
      msg = JSON.parse(e.target.responseText);
      msg.http_status = e.target.status;
    } catch (error) {
        msg.reason = e.target.status + " " + e.target.statusText;
    }
    if(msg.http_status == 200) {
      self.parent.token = msg.result.token;
      self.parent.uuid = msg.result.participant_uuid;
      self.parent.role = msg.result.role;
      self.parent.version = msg.result.version;
      self.parent.chat_enabled = msg.result.chat_enabled;
      self.parent.fecc_enabled = msg.result.fecc_enabled;
      self.parent.rtmp_enabled = msg.result.rtmp_enabled;
      self.parent.rtsp_enabled = msg.result.rtsp_enabled;
      self.parent.analytics_enabled = msg.result.analytics_enabled;
      // self.parent.allow_1080p = msg.result.allow_1080p;
      self.parent.service_type = msg.result.service_type;
      self.parent.current_service_type = msg.result.current_service_type;
      self.parent.remote_call_type = msg.result.call_type;
      self.parent.guests_can_present = msg.result.guests_can_present;
      self.parent.conference_name = msg.result.conference_name;

      if (self.parent.edge_ver > 10527) {
        self.parent.pcConfig.bundlePolicy = 'max-compat';
      }

      self.parent.pcConfig.iceServers = [];
      if (self.parent.default_stun) {
        if (self.parent.firefox_ver > 43 || self.parent.edge_ver > 10527 || self.parent.safari_ver > 603) {
            self.parent.pcConfig.iceServers.push({ 'urls' : [self.parent.default_stun] });
        } else {
            self.parent.pcConfig.iceServers.push({ 'url' : self.parent.default_stun });
        }
      }

      if (self.parent.turn_server && self.parent.edge_ver == 0) {
        var turn_servers = []
        if (self.parent.turn_server instanceof Array) {
            turn_servers = self.parent.turn_server;
        } else {
            turn_servers.push(self.parent.turn_server);
        }
        for (var i=0; i<turn_servers.length; i++) {
            if (self.parent.safari_ver > 603) {
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
            self.parent.pcConfig.iceServers.push(turn_servers[i]);
        }
      }

      if ('stun' in msg.result) { // && self.parent.edge_ver == 0
        for (var i = 0; i < msg.result.stun.length; i++) {
            if (self.parent.firefox_ver > 43 || self.parent.safari_ver > 603) {
                self.parent.pcConfig.iceServers.push({ 'urls' : [msg.result.stun[i].url] });
            } else {
                self.parent.pcConfig.iceServers.push(msg.result.stun[i]);
            }
        }
      }
      console.log("ICE Servers:", self.parent.pcConfig);
      if ('bandwidth_in' in msg.result) {
        self.parent.set_bandwidth_in = msg.result.bandwidth_in - 64;
        if (self.parent.set_bandwidth_in < self.parent.bandwidth_in) {
            self.parent.bandwidth_in = self.parent.set_bandwidth_in;
        }
      }
      if ('bandwidth_out' in msg.result) {
          self.parent.set_bandwidth_out = msg.result.bandwidth_out - 64;
          if (self.parent.set_bandwidth_out < self.parent.bandwidth_out) {
              self.parent.bandwidth_out = self.parent.set_bandwidth_out;
          }
      }

    } else if (msg.http_status == 403 && msg.status === 'success') {
      if ('pin' in msg.result) {
        if (msg.result.guest_pin == 'none') {
            self.parent.pin_status = 'optional';
        } else {
            self.parent.pin_status = 'required';
        }
      }
      if ('conference_extension' in msg.result) {
        self.parent.conference_extension = msg.result.conference_extension_type;
      }
    }else{
      console.error(msg.result || msg.reason)
    }

    if (!self.parent.token_refresh && self.parent.token) {
      var expires = msg.result.expires || 120;
      // dev 注释
      self.parent.token_refresh = setInterval(self.refreshToken.bind(this), (expires * 1000) / 3);

      self.sendRequest("conference_status", null, function(e) {
          console.log("发送conference_status请求");
          if (e.target.status == 200 && self.onConferenceUpdate) { //
              var msg = JSON.parse(e.target.responseText);
              console.log("conference_status返回数据：", msg);
              self.onConferenceUpdate(msg.result);
          }
      }, "GET");
    }
    console.log("request_token返回数据：", self.parent)

    if(cb) {
      cb()
    }
  }
  /**
   * refreshToken
   * @description 刷新token
   */
  pexPort.prototype.refreshToken = function () {
    var self = this;
    self.sendRequest('refresh_token', null, function(e) {
      // TODO
      var msg = {};
      try {
        msg = JSON.parse(e.target.responseText);
      }catch (error) {
        msg.reason = e.target.status + " " + e.target.statusText;
      }
      if(e.target.status == 200) {
        // 重新赋值 token
        self.parent.token = msg.result.token;
      }else {
        console.error('refresh_token error', msg.result || msg.reason);
      }
    })
  }
  /**
   * releaseToken
   * @param token
   * @param error
   * @param reason
   */
  pexPort.prototype.releaseToken = function (token, error, reason) {
    var self = this;
    if(token) {
      var params = {};
      if(error) {
        params['error'] = error;
      }
      if(reason) {
        params['reason'] = reason;
      }
      self.sendRequest('release_token', params, false);
    }
  }
  /**
   * conferenceStatus
   * @description 判断会议状态
   */
  pexPort.prototype.conferenceStatus = function () {
    var self = this;
    self.sendRequest('conference_status', null, function (e) {
      if(e.target.status == 200) {
        var msg = JSON.parse(e.target.responseText);
        // TODO
      }
    }, "GET");
  }
  /**
   * setLock
   * @description 锁定/解锁会议
   */
  pexPort.prototype.setLock = function (setting) {
    var self = this;
    var command = setting ? 'lock' : 'unlock';
    self.sendRequest(command);
  }
  /**
   * sendMessage
   * @param message
   * @description 发送聊天消息
   */
  pexPort.prototype.sendMessage = function (message) {
    var self = this;
    var command = "message";
    var params = {'type': 'text/plain', 'payload': message};
    self.sendRequest(command, params);
  }
  /**
   * setMuteAllGuests
   * @param setting
   * @description 设置所有参会者的语音状态
   */
  pexPort.prototype.setMuteAllGuests = function (setting) {
    var self = this;
    var command = setting ? "muteguests" : "unmuteguests";
    self.sendRequest(command);
  }
  /**
   * startConference
   * @description
   */
  pexPort.prototype.startConference = function () {
    var self = this;
    var command = "start_conference";
    self.sendRequest(command);
  }
  /**
   * disconnectAll
   * @description 挂断所有参会者
   */
  pexPort.prototype.disconnectAll = function() {
    var self = this;
    var command = "disconnect";
    self.sendRequest(command);
  };
  /**
   * getParticipants
   * @param cb
   * @description 获取所有参会者列表
   */
  pexPort.prototype.getParticipants = function(cb) {
    var self = this;
    var command = "participants";
    self.sendRequest(command, {}, cb, "GET");
  };
  pexPort.prototype.setParticipantMute = function(uuid, setting) {
    var self = this;
    var command = "participants/" + uuid + "/";
    command += setting ? "mute" : "unmute";
    self.sendRequest(command);
  };
  pexPort.prototype.unlockParticipant = function(uuid) {
    var self = this;

    var command = "participants/" + uuid + "/unlock";
    self.sendRequest(command);
  };
  pexPort.prototype.disconnectParticipant = function(uuid) {
    var self = this;

    var command = "participants/" + uuid + "/disconnect";
    self.sendRequest(command);
  };
  pexPort.prototype.setRole = function(uuid, role) {
    var self = this;

    if (role !== 'chair' && role !== 'guest') {
        throw new Error("Role must be chair or guest");
    }
    var command = "participants/" + uuid + "/role";
    var params = { 'role': role };
    self.sendRequest(command, params, function() {});
  };


  pexPort.prototype.sendRequest = function(request, params, cb, req_method, retries) {
    var self = this;
    // Only do async if explicitly asked
    var async = cb === false ? false : true;
    var method = req_method || "POST";
    var xhr = new XMLHttpRequest();
    var xhrUrl = "https://" + self.parent.node + "/api/client/v2/conferences/" + self.parent.conference_uri + "/" + request;
    console.log("pexPort.sendRequest", request, params, method, xhrUrl);
    xhr.open(method, xhrUrl, async);
    if (cb) {
      xhr.onload = cb;
    }
    if (retries === undefined) {
      retries = 0;
    }
    xhr.onerror = function() {
      if (++retries > 10 || cb === false) {
          console.error("Error sending request: " + request);
          // self.onError(self.trans.ERROR_CONNECTING);
      } else {
          setTimeout(function() { self.sendRequest(request, params, cb, method, retries); }, retries * 500);
      }
    };
    xhr.ontimeout = function() {
        if (++retries > 10 || cb === false) {
          console.error("Timeout sending request: " + request);
          // self.onError(self.trans.ERROR_CONNECTING);
        } else {
          setTimeout(function() { self.sendRequest(request, params, cb, method, retries); }, retries * 500);
        }
    };
    if(tool.getCookie("JwtToken")){
    	xhr.setRequestHeader("JwtToken",tool.getCookie("JwtToken"));
    }
    if (self.parent.token) {
        xhr.setRequestHeader('token', self.parent.token);
    } else if (self.parent.pin !== null) {
        xhr.setRequestHeader('pin', self.parent.pin);
    }
    // if (self.parent.basic_username && self.parent.basic_password) {
    //     xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.parent.basic_username + ':' + self.parent.basic_password));
    // }
    if (params) {
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(params));
    } else {
        xhr.send();
    }
    if (cb === false) {
        console.log("pexPort.sendRequest response", xhr.responseText);
        var msg = {};
        try {
            msg = JSON.parse(xhr.responseText);
        } catch (error) {
            msg.reason = xhr.status + " " + xhr.statusText;
        }
        msg.http_status = xhr.status;
        return msg;
    }
  }

  /**************************************************************/
  pexPort.prototype.Call_calls = function (state, sdp, cb) {
    var self = this;
    // if(self.parent.state == 'CONNECTING' || self.parent.state == 'UPDATING') {
    //   var mutateOffer = {'call_type': 'WEBRTC', 'sdp': sdp}
    // }
    // var mutateOffer = {'call_type': 'WEBRTC', 'sdp': sdp}
    var request = state == 'UPDATING' ? 'calls/' + self.parent.call_uuid + '/update' : 'calls';
    self.sendRequestCall(request, sdp, function(e){
      cb(e)
    })
  }
  // pexPort.prototype.processAnswer = function (sdp) {
  //   var self = this;
  //   peerConnection.processAnswer(sdp, function(){
  //     console.log("Remote description active");
  //     self.Call_ack();
  //   })
  // }

  pexPort.prototype.Call_ack = function(cb) {
    var self = this;
    console.log("Remote description active");

    if (self.parent.recv_audio === false && self.parent.recv_video === false && self.parent.chrome_ver > 47 && self.parent.localStream) {
      peerConnection.pcAddStream([self.parent.localStream]);
    }
    self.sendRequestCall('calls/' + self.parent.call_uuid + '/ack', null, function() {
      // TODO
      cb();
      console.log('ack接口返回', self.parent.state)
    });
  }
  pexPort.prototype.Call_disconnect = function (cb) {
    var self = this;
    if (self.parent.state != 'DISCONNECTING') {
      self.parent.state = 'DISCONNECTING';
      if(self.parent.token) {
        self.sendRequestCall('calls/' + self.parent.call_uuid + '/disconnect', {}, cb);
      }
    }
  }
  pexPort.prototype.sendRequestCall = function(request, params, cb, retries) {
    var self = this;
    // Only do async if explicitly asked
    var async = cb === false ? false : true;
    var xhr = new XMLHttpRequest();
    var xhrUrl = "https://" + self.parent.node + "/api/client/v2/conferences/" + self.parent.conference_uri + "/participants/" + self.parent.uuid + "/" + request;
    console.log("pexPortCall.sendRequest", request, params, xhrUrl);
    xhr.open("POST", xhrUrl, async);
    if (cb) {
      xhr.onload = cb;
    }
    if (retries === undefined) {
      retries = 0;
    }
    xhr.onerror = function() {
      if (++retries > 10 || cb === false) {
          console.error("Error sending request: " + request);
      } else {
          setTimeout(function() { self.sendRequest(request, params, cb, retries); }, retries * 500);
      }
    };
    xhr.ontimeout = function() {
        if (++retries > 10 || cb === false) {
          console.error("Timeout sending request: " + request);
        } else {
          setTimeout(function() { self.sendRequest(request, params, cb, retries); }, retries * 500);
        }
    };
    /*xhr.withCredentials = true;*/
    if (tool.getCookie('JwtToken')) {
      xhr.setRequestHeader("JwtToken", tool.getCookie('JwtToken'));
    }
    if (self.parent.token) {
        xhr.setRequestHeader('token', self.parent.token);
    } else if (self.parent.pin !== null) {
        xhr.setRequestHeader('pin', self.parent.pin);
    }
    // if (self.parent.basic_username && self.parent.basic_password) {
    //     xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.parent.basic_username + ':' + self.parent.basic_password));
    // }
    if (params) {
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(params));
    } else {
        xhr.send();
    }
    if (cb === false) {
        console.log("pexPortCall.sendRequest response", xhr.responseText);
        var msg = {};
        try {
            msg = JSON.parse(xhr.responseText);
        } catch (error) {
            msg.reason = xhr.status + " " + xhr.statusText;
        }
        msg.http_status = xhr.status;
        return msg;
    }
  }


export default new pexPort()

