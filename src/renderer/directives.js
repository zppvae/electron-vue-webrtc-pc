/**
 * 自定义指令
 */
import Vue from 'vue'
import store from './store/index';
import { mapState, mapGetters, mapActions } from 'vuex';

Vue.directive('autoFocus', {
  bind: function (el, binding) {
    el.focus();
    // console.log( 'bind',binding.value );
  },
  inserted:function (el, binding) {
    el.value = binding.value;
    // console.log('inserted',el.value)
  },
  update:function (el, binding) {
    // console.log('update', binding.value)
  },
  componentUpdated:function (el, binding) {
    // console.log('componentUpdated',binding.value)
  },
  unbind:function (el, binding) {
    // console.log('unbind',binding.value)
  }
});

Vue.directive('rtcVolume', {
  bind: function (el, binding) {
    // el.focus();
    // console.log( 'bind',binding.value );
  },
  inserted:function (el, binding) {
    el.value = binding.value;
    // console.log('inserted',el.value)
  },
  update:function (el, binding) {
    // console.log("update===", binding.value+ "--"+binding.oldValue)
    if(binding.value != binding.oldValue){
      // const _devices =  store.getters.getDevices;

      const audioOutput = _devices.audioOutput || 'default';
  
      let domElement = el;
      let src = domElement.src;
      domElement.src = '';
      domElement.setSinkId(audioOutput)
      .then(function () {
        console.log('Audio output sat to', audioOutput);
      })
      .catch(function (error) {
        console.error('Unable to set audio output', error);
      })
      .then(function() {
        // Workaround for nwjs (bis): resume playing the video
        domElement.src = src;
      });
    }
    
  },
  componentUpdated:function (el, binding) {
    // console.log('componentUpdated',binding.value)
  },
  unbind:function (el, binding) {
    console.log('unbind',binding.value)
  }
})