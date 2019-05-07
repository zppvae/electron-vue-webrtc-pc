
define(function(){
  var devicesSources = function() {
    var service = {};
  
    function parseDevices(devices, keepOriginal) {
      var result = {
        audio: [],
        video: [],
        output: []
      };
  
      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        if(keepOriginal || device.label !== 'Default') {
          switch (device.kind) {
            case 'audio':
            case 'audioinput':
              result.audio.push({
                id: device.id || device.deviceId,
                kind: 'audio',
                label: device.label || 'Microphone ' + (result.audio.length + 1)
              });
              break;
            case 'video':
            case 'videoinput':
              result.video.push({
                id: device.id || device.deviceId,
                kind: 'video',
                label: device.label || 'Camera ' + (result.video.length + 1)
              });
              break;
            case 'audiooutput':
              result.output.push({
                id: device.id || device.deviceId,
                kind: 'output',
                label: device.label || 'Output ' + (result.output.length + 1)
              });
              break;
          }
        }
      }
  
      if(!keepOriginal) {
        result.video.push({
          id: false,
          kind: 'video',
          label: 'IDS_SETTINGS_CAMERA_NONE'
        });
  
        result.audio.push({
          id: false,
          kind: 'audio',
          label: 'IDS_SETTINGS_MICROPHONE_NONE'
        });
      }
      return result;
    }
  
    service.enumerateDevices = function (keepOriginal) {
      var devices = new Promise((resolve,reject) => {});
  
      function enumerateDevicesSuccess(result) {
        console.log('enumerateDevices succeeded:', result);
        Promise.resolve(parseDevices(result, keepOriginal));
      }
  
      function enumerateDevicesError(error) {
        console.error('enumerateDevices failed:', error);
        Promise.reject(error);
      }
  
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
            navigator.mediaDevices.enumerateDevices()
                .then(enumerateDevicesSuccess)
                .catch(enumerateDevicesError);
        } catch (e) {
            enumerateDevicesError(e);
        }
      } else if (window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
          window.MediaStreamTrack.getSources(enumerateDevicesSuccess);
      } else {
          enumerateDevicesError('Unsupported browser');
      }
  
      return devices;
    }
  
    service.getInvalidDevices = function (devices) {
      console.log('Validating media devices', devices);
  
      return service.enumerateDevices(true)
      .then(function (validDevices) {
        console.log('Valid devices', validDevices);
        var invalidDevices = [];
        for (let i = 0; i < devices.length; i++) {
          const device = devices[i];
          var valid = false;
          for (let v = 0; v < validDevices[device.kind] || [].length; v++) {
            const validDevice = validDevices[device.kind] || [][v];
            if(device.id === validDevice.id) {
              valid = true;
            }
          }
          if(!valid) {
            invalidDevices.push(device);
          }
        }
  
        if(invalidDevices.length) {
          console.error('Invalid device IDs:', invalidDevices);
        }
        return {
          invalidDevices: invalidDevices,
          validDevices: validDevices
        }
      })
      .catch(function (error) {
        console.error('Could not validate devices:', error);
        return {
          invalidDevices: [],
          validDevices: []
        };
      })
    }
  
    return service;
  }

  return new devicesSources()
})