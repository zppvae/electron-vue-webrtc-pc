/** 
 * 获取媒体流信息
 * 
 */
let RTCStreamStatistics = require('./getRTCStreamStatistics').default;

  'use strict';
  function RTCStatistics() {
    var self = this;

    self.audio_out = new RTCStreamStatistics();
    self.audio_in = new RTCStreamStatistics();
    self.video_out = new RTCStreamStatistics();
    self.video_in = new RTCStreamStatistics();
    self.googCpuLimitedResolution = "false";
    
  }
  RTCStatistics.prototype.updateStats = function(results) {
    var self = this;
    for (var i = 0; i < results.length; ++i) {
        if (self.statIsOfType(results[i], 'audio', 'send')) self.audio_out.updateTxStats(results[i]);
        else if (self.statIsOfType(results[i], 'audio', 'recv')) self.audio_in.updateRxStats(results[i]);
        else if (self.statIsOfType(results[i], 'video', 'send')) { self.video_out.updateTxStats(results[i]); self.updateGoogCpuLimitedResolution(results[i]); }
        else if (self.statIsOfType(results[i], 'video', 'recv')) self.video_in.updateRxStats(results[i]);
        else if (self.statIsBandwidthEstimation(results[i])) self.video_out.updateBWEStats(results[i]);
    }
  };

  RTCStatistics.prototype.updateStatsFF = function(results) {
    var self = this;

    var keys = results.keys();
    for (var key_i = keys.next(); !key_i.done; key_i = keys.next()) {
        var key = key_i.value;
        if (key.indexOf('outbound_rtp_audio') === 0) self.audio_out.updateTxStatsFF(results.get(key));
        else if (key.indexOf('outbound_rtcp_audio') === 0) self.audio_out.updateRtcpTxStatsFF(results.get(key));
        else if (key.indexOf('inbound_rtp_audio') === 0) self.audio_in.updateRxStatsFF(results.get(key));
        else if (key.indexOf('outbound_rtp_video') === 0) self.video_out.updateTxStatsFF(results.get(key));
        else if (key.indexOf('outbound_rtcp_video') === 0) self.video_out.updateRtcpTxStatsFF(results.get(key));
        else if (key.indexOf('inbound_rtp_video') === 0) self.video_in.updateRxStatsFF(results.get(key));
    }
  };

  RTCStatistics.prototype.updateStatsSafari = function(results) {
    var self = this;

    var keys = results.keys();
    for (var key_i = keys.next(); !key_i.done; key_i = keys.next()) {
        var key = key_i.value;
        if (key.indexOf('RTCOutboundRTPAudioStream') === 0) self.audio_out.updateTxStatsFF(results.get(key));
        else if (key.indexOf('RTCInboundRTPAudioStream') === 0) self.audio_in.updateRxStatsFF(results.get(key));
        else if (key.indexOf('RTCOutboundRTPVideoStream') === 0) self.video_out.updateTxStatsFF(results.get(key));
        else if (key.indexOf('RTCInboundRTPVideoStream') === 0) self.video_in.updateRxStatsFF(results.get(key));
    }
  };

  RTCStatistics.prototype.statIsBandwidthEstimation = function(result) {
    return result.type == 'VideoBwe';
  };

  RTCStatistics.prototype.statIsOfType = function(result, type, direction) {
    var self = this;
    return result.type == 'ssrc' && result.stat('mediaType') == type && result.id.search(direction) != -1;
  };

  RTCStatistics.prototype.updateGoogCpuLimitedResolution = function(result) {
    var self = this;

    var newLimit = result.stat('googCpuLimitedResolution');
    if (newLimit == "true" && newLimit != self.googCpuLimitedResolution && self.parent.chrome_ver > 55 && self.parent.h264_enabled == true) {
        self.parent.onLog('googCpuLimitedResolution triggered, renegotiating to VP8');
        self.googCpuLimitedResolution = newLimit;
        self.parent.h264_enabled = false;
        self.parent.renegotiate();
    }
  };

  RTCStatistics.prototype.getStats = function() {
    var self = this;
    if (self.parent.firefox_ver > 0 && self.parent.firefox_ver < 47) {
        return {};
    }
    if (self.audio_in.lastTimestamp === null) {
        return {};
    }
    return {'outgoing': {'audio': self.audio_out.getStats(),
                        'video': self.video_out.getStats()},
            'incoming': {'audio': self.audio_in.getStats(),
                        'video': self.video_in.getStats()}};
  };

export default new RTCStatistics();