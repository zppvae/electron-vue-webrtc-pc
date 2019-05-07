  'use strict';
  var JPEGPresentation = function () {
    var self = this;
    self.state = 'IDLE';
    self.parent = null;
    self.call_uuid = null;

    self.onError = null;
    self.onSetup = null;
    self.onConnect = null;
    self.onDisconnect = null;
  }
  JPEGPresentation.prototype.makeCall = function (parent) {
    var self = this;
    self.parent = parent;
    self.onSetup(self);
  };

  JPEGPresentation.prototype.connect = function () {
    var self = this;

    self.state = 'CONNECTING';
    var callRequest = {'call_type' : 'presentation'};
    self.sendRequest('participants/' + self.parent.uuid + '/calls', callRequest, function(e) {
        self.processAnswer(e);
    });
  };

  JPEGPresentation.prototype.processAnswer = function(e) {
    var self = this;

    var msg;
    try {
        msg = JSON.parse(e.target.responseText);
    } catch (SyntaxError) {
        return self.handleError("Unexpected Response: " + e.target.status + " " + e.target.statusText);
    }
    if (e.target.status != 200) {
        return self.handleError(msg.result || msg.reason);
    }

    self.state = 'CONNECTED';
    self.onConnect({});
    // console.log(msg.result);
    self.call_uuid = msg.result.call_uuid;
  };

  JPEGPresentation.prototype.sendRequest = function(request, params, cb, files, retries) {
    var self = this;

    // Only do async if explicitly asked
    var async = cb === false ? false : true;
    var xhr = new XMLHttpRequest();
    var xhrUrl = "https://" + self.parent.node + "/api/client/v2/conferences/" + self.parent.conference_uri + "/" + request;
    // console.log("JPEGPresentation.sendRequest", request, params, files, xhrUrl);
    xhr.open("POST", xhrUrl, async);
    if (cb) {
        xhr.onload = cb;
    }
    if (retries === undefined) {
        retries = 0;
    }
    xhr.onerror = function() {
        if (++retries > 10 || cb === false) {
            self.onError(self.parent.trans.ERROR_CONNECTING);
        } else {
            setTimeout(function() { self.sendRequest(request, params, cb, files, retries); }, retries * 500);
        }
    };
    xhr.ontimeout = function() {
        if (++retries > 10 || cb === false) {
            self.onError(self.parent.trans.ERROR_CONNECTING);
        } else {
            setTimeout(function() { self.sendRequest(request, params, cb, files, retries); }, retries * 500);
        }
    };
    // if(getCookie("JwtToken")){
    //   xhr.setRequestHeader("JwtToken",getCookie("JwtToken"));
    // }
    if (self.parent.token) {
        xhr.setRequestHeader('token', self.parent.token);
    }
    if (self.parent.basic_username && self.parent.basic_password) {
        xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.parent.basic_username + ':' + self.parent.basic_password));
    }
    if (params) {
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(params));
    } else if (files) {
        xhr.send(files);
    } else {
        xhr.send();
    }
    if (cb === false) {
        console.log("JPEGPresentation.sendRequest response", xhr.responseText);
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

  JPEGPresentation.prototype.sendPresentationImageFile = function(file_element) {
    var self = this;
    if (!file_element || !file_element.files.length) {
        console.log("JPEGPresentation.sendPresentationImageFile error:", "Element not given");
    }
    self.sendPresentationImage(file_element.files[0]);
  };

  JPEGPresentation.prototype.sendPresentationImage = function(image) {
    var self = this;
    var blob = new Blob([image], {"type": "image/jpeg"});
    var formdata = new FormData();
    formdata.append("frame", blob);
    console.log("JPEGPresentation.sendPresentationImage", formdata);
    self.sendRequest('presentation', null, function() {}, formdata);
  };

  JPEGPresentation.prototype.remoteDisconnect = function(msg) {
    var self = this;

    var reason = self.parent.trans.ERROR_DISCONNECTED_SCREENSHARE;
    if ('reason' in msg) {
        reason = msg.reason;
    }
    self.onDisconnect(reason);
  };

  JPEGPresentation.prototype.disconnect = function() {
    var self = this;

    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        if (self.parent.token) {
            self.sendRequest('participants/' + self.parent.uuid + '/calls/' + self.call_uuid + '/disconnect', false);
            self.onDisconnect(self.parent.trans.ERROR_PRESENTATION_ENDED);
        }
    }
  };

  JPEGPresentation.prototype.handleError = function (err) {
    var self = this;

    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        if (self.onError) {
            self.onError(err);
        }
        // Needed? Same behaviour as Screen presentation
        if (self.onDisconnect) {
            self.onDisconnect(self.parent.trans.ERROR_PRESENTATION_ENDED);
        }
    }
  };

export default JPEGPresentation;