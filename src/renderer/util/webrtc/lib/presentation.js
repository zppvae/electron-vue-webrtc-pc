/*** 双流/共享 ****/

define(function() {
  'use strict';
  var Presentation = function () {
    var self = this;
    self.state = 'IDLE';
    self.parent = null;
    
  }
  Presentation.prototype.init = function (parent) {
    var self = this;
    self.parent = parent;
  }
  Presentation.prototype.present = function(call_type) {
    var self = this;
    
  }
  Presentation.prototype.getPresentationURL = function() {
    var self = this;
    
  }
  Presentation.prototype.getPresentation = function() {
    var self = this;
  }
  Presentation.prototype.stopPresentation = function() {
    var self = this;
  }
  Presentation.prototype.processPresentation = function(msg) {
    var self = this;
  }
  Presentation.prototype.sendPresentationImage = function(file) {
    var self = this;
  }
  
  return new Presentation();
});