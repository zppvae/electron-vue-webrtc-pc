
  'use strict';
  function RTCStreamStatistics() {
    var self = this;

    self.lastPackets = 0;
    self.lastLost = 0;
    self.lastBytes = 0;
    self.lastTimestamp = null;
    self.recentTotal = 0;
    self.recentLost = 0;
    self.samples = [];
    self.info = {};
  }
  RTCStreamStatistics.prototype.getStats = function() {
    var self = this;
    return self.info;
  };

  RTCStreamStatistics.prototype.updateBWEStats = function(result) {
    var self = this;
    self.info['configured-bitrate'] = (result.stat('googTargetEncBitrate') / 1000).toFixed(1) + 'kbps';
  };

  RTCStreamStatistics.prototype.updatePacketLossStats = function(currentTotal, currentLost) {
    var self = this;
    if (currentTotal === 0) {
        self.info['percentage-lost'] = '0%';
    } else {
        self.info['percentage-lost'] = (currentLost / currentTotal * 100).toFixed(1) + '%';
    }

    var sample;
    if (self.samples.length >= 60) {
        sample = self.samples.shift();
        self.recentLost -= sample[0];
        self.recentTotal -= sample[1];
    }
    sample = [Math.max(currentLost - self.lastLost, 0), currentTotal - self.lastPackets];
    self.recentLost += sample[0];
    self.recentTotal += sample[1];
    self.samples.push(sample);

    if (self.recentTotal === 0) {
        self.info['percentage-lost-recent'] = '0%';
    } else {
        self.info['percentage-lost-recent'] = (self.recentLost / self.recentTotal * 100).toFixed(1) + '%';
    }
  };

  RTCStreamStatistics.prototype.updateRxStats = function(result) {
    var self = this;
    self.info['packets-received'] = result.stat('packetsReceived');
    self.info['packets-lost'] = result.stat('packetsLost');
    self.info['percentage-lost'] = 0;
    self.info['percentage-lost-recent'] = 0;
    self.info['bitrate'] = "unavailable";

    var packetsReceived = parseInt(self.info['packets-received']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    self.updatePacketLossStats(packetsReceived, packetsLost);

    if (self.lastTimestamp > 0) {
        var kbps = Math.round((result.stat('bytesReceived') - self.lastBytes) * 8 / (result.timestamp - self.lastTimestamp));
        self.info['bitrate'] = kbps + 'kbps';
    }

    if (result.stat('googFrameHeightReceived'))
        self.info['resolution'] = result.stat('googFrameWidthReceived') + 'x' + result.stat('googFrameHeightReceived');

    if (result.stat('googCodecName'))
        self.info['codec'] = result.stat('googCodecName');

    if (result.stat('googDecodeMs'))
        self.info['decode-delay'] = result.stat('googDecodeMs') + 'ms';

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.stat('bytesReceived');
    self.lastPackets = packetsReceived;
    self.lastLost = packetsLost;
  };

  RTCStreamStatistics.prototype.updateTxStats = function(result) {
    var self = this;

    self.info['packets-sent'] = result.stat('packetsSent');
    self.info['packets-lost'] = result.stat('packetsLost');
    self.info['percentage-lost'] = 0;
    self.info['percentage-lost-recent'] = 0;
    self.info['bitrate'] = "unavailable";

    var packetsSent = parseInt(self.info['packets-sent']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    self.updatePacketLossStats(packetsSent, packetsLost);

    if (self.lastTimestamp > 0) {
        var kbps = Math.round((result.stat('bytesSent') - self.lastBytes) * 8 / (result.timestamp - self.lastTimestamp));
        self.info['bitrate'] = kbps + 'kbps';
    }

    if (result.stat('googFrameHeightSent'))
        self.info['resolution'] = result.stat('googFrameWidthSent') + 'x' + result.stat('googFrameHeightSent');

    if (result.stat('googCodecName'))
        self.info['codec'] = result.stat('googCodecName');

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.stat('bytesSent');
    self.lastPackets = packetsSent;
    self.lastLost = packetsLost;
  };

  RTCStreamStatistics.prototype.updateRxStatsFF = function(result) {
    var self = this;

    self.info['packets-received'] = result.packetsReceived;
    self.info['packets-lost'] = result.packetsLost;
    self.info['percentage-lost'] = 0;
    self.info['bitrate'] = "unavailable";

    var packetsReceived = parseInt(self.info['packets-received']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    self.updatePacketLossStats(packetsReceived, packetsLost);

    if (self.lastTimestamp > 0) {
        var tsDiff = result.timestamp - self.lastTimestamp;
        if (tsDiff > 500000) {
            // Safari is in milliseconds
            tsDiff = tsDiff / 1000;
        }
        var kbps = Math.round((result.bytesReceived - self.lastBytes) * 8 / tsDiff);
        self.info['bitrate'] = kbps + 'kbps';
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.bytesReceived;
    self.lastPackets = packetsReceived;
    self.lastLost = packetsLost;
  };

  RTCStreamStatistics.prototype.updateTxStatsFF = function(result) {
    var self = this;

    self.info['packets-sent'] = result.packetsSent;
    self.info['bitrate'] = "unavailable";

    var packetsSent = parseInt(self.info['packets-sent']) | 0;

    if (self.lastTimestamp > 0) {
        var tsDiff = result.timestamp - self.lastTimestamp;
        if (tsDiff > 500000) {
            tsDiff = tsDiff / 1000;
        }
        var kbps = Math.round((result.bytesSent - self.lastBytes) * 8 / tsDiff);
        self.info['bitrate'] = kbps + 'kbps';
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.bytesSent;
    self.lastPackets = packetsSent;
  };

  RTCStreamStatistics.prototype.updateRtcpTxStatsFF = function(result) {
    var self = this;

    self.info['packets-lost'] = result.packetsLost;
    //self.info['jitter'] = result.jitter;

    var packetsSent = parseInt(self.info['packets-sent']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;
    self.updatePacketLossStats(packetsSent, packetsLost);
  };

  export default RTCStreamStatistics;