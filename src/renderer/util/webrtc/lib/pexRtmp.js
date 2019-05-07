
let rtcPort = require('./pexPort').default;
let tool = require('./tool').default;
  function RTMPCall() {
    var self = this;

    self.state = 'IDLE';
    self.parent = null;
    self.bandwidth_in = 1280;
    self.bandwidth_out = 1280;
  }
  RTMPCall.prototype.init = function(parent, params) {
    var self = this;
    self.parent = parent;
    rtcPort.init(parent, params)
    self.parent.conference_uri = encodeURIComponent(params.uri);
    
    self.makeCall(self.parent.call_type)
  }
  RTMPCall.prototype.makeCall = function(call_type) {
    var self = this;
    self.state = 'ACTIVE',
    self.bandwidth_in = self.parent.bandwidth_in;
    self.bandwidth_out = self.parent.bandwidth_out;
    self.call_type = call_type;
    
    // self.connect();
  }
  RTMPCall.prototype.connect = function () {
    var self = this;
    self.state = 'CONNECTING';
    var callRequest = {'call_type' : 'RTMP', 'bandwidth' : self.bandwidth_in };
    if (self.call_type == 'stream') {
        callRequest.streaming = 'true';
    }
    if (self.call_type == 'presentation') {
        callRequest.present = 'receive';
    } else if (self.presentation_in_main) {
        callRequest.present = 'main';
    }
    if (self.call_type == 'audioonly') {
        callRequest.audioonly = 'true';
    }
    self.sendRequest('calls', callRequest, function(e) {
        self.processAnswer(e);
    });
  };
  
  RTMPCall.prototype.disconnect = function(cb) {
    var self = this;

    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        console.log('Sending disconnect');
        if (self.parent.token) {
            self.sendRequest('calls/' + self.call_uuid + '/disconnect', {}, cb);
        }
        if (self.flash) {
            self.flash.close();
        }
        tool.bindEvent_value('url', '');
    }
  };
  RTMPCall.prototype.processAnswer = function(e) {
    var self = this;
  
    var msg;
    try {
        msg = JSON.parse(e.target.responseText);
    } catch (SyntaxError) {
        return //self.handleError("Unexpected Response: " + e.target.status + " " + e.target.statusText);
    }
    if (e.target.status != 200) {
        return //self.handleError(msg.result || msg.reason);
    }
  
    self.state = 'CONNECTED';
    // Extract and remove /uuid from rtmp url's
    // Format: rtmp(s)://host:port/application/uuid
    // where uuid = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (length 36)
    var uuid = msg.result.url.substr(msg.result.url.length - 36, 36);
    console.log('UUID', uuid);
    var rtmp_url = msg.result.url.substr(0, msg.result.url.length - 37);
    console.log('rtmp_url', rtmp_url);
    var rtmps_url = '';
    if (msg.result.secure_url) {
        rtmps_url = msg.result.secure_url.substr(0, msg.result.secure_url.length - 37);
        console.log('rtmps_url', rtmps_url);
    }
  
    self.call_type = msg.result.call_type;
    self.call_uuid = msg.result.call_uuid;
  
    if (self.flash) {
        self.flash.startCall(rtmps_url, rtmp_url, uuid, self.parent.display_name, self.bandwidth_out,
                             self.audio_source, self.video_source, self.call_type == 'audioonly');
    }
  
    if (self.call_type == 'stream') {
        remoteServiceUri += '-stream';
    }
    // tool.returnRtmpData(msg);
    // console.log('============', msg)
    // tool.bindEvent_value('callUuid', msg.result.call_uuid);
    tool.bindEvent_value('url', msg.result.url);
    //self.onConnect(remoteServiceUri);
  };
  
  RTMPCall.prototype.sendRequest = function(request, params, cb, retries) {
    var self = this;
  
    // Only do async if explicitly asked
    var async = cb === false ? false : true;
    var xhr = new XMLHttpRequest();
    var xhrUrl = "https://" + self.parent.node + "/api/client/v2/conferences/" + self.parent.conference_uri + "/participants/" + self.parent.uuid + "/" + request;
    // self.parent.onLog("PexRTMP.sendRequest", request, params, xhrUrl);
    xhr.open("POST", xhrUrl, async);
    if (cb) {
        xhr.onload = cb;
    }
    if (retries === undefined) {
        retries = 0;
    }
    xhr.onerror = function() {
        if (++retries > 10 || cb === false) {
            // self.onError(self.parent.trans.ERROR_CONNECTING);
        } else {
            setTimeout(function() { self.sendRequest(request, params, cb, retries); }, retries * 500);
        }
    };
    xhr.ontimeout = function() {
        if (++retries > 10 || cb === false) {
            // self.onError(self.parent.trans.ERROR_CONNECTING);
        } else {
            setTimeout(function() { self.sendRequest(request, params, cb, retries); }, retries * 500);
        }
    };
    if (self.parent.token) {
        xhr.setRequestHeader('token', self.parent.token);
    }
    if (self.parent.basic_username && self.parent.basic_password) {
        xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.parent.basic_username + ':' + self.parent.basic_password));
    }
    if (params) {
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(params));
    } else {
        xhr.send();
    }
    if (cb === false) {
        // self.parent.onLog("PexRTMP.sendRequest response", xhr.responseText);
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

export default new RTMPCall()
