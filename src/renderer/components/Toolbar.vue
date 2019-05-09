<template>
  <div class="tool-bar-center">
      <!-- 设置 -->
      <!-- <a href="javascript:;" class="tool-item pull-left toggle-sidebar" title="设置">
        <i class="tool-icon icon-mdi-setup-video"></i>
      </a> -->
      <!-- 共享 -->
      <!-- <a href="javascript:;" class="tool-item" title="共享">
        <i class="tool-icon icon-mdi-picture-as-pdf"></i>
        <span>共享</span>
      </a> -->

      <!-- 摄像头开关 -->
      <a href="javascript:;" class="tool-item" @click="handleCamera()" title="摄像头">
        <i class="tool-icon" :class="[cameraMuted ? 'icon-mdi-videocam-off' : 'icon-mdi-videocam']"></i>
        <span>摄像头</span>
      </a>
      <!-- 麦克风开关 -->
      <a href="javascript:;" class="tool-item" @click="handleMicrophone()" title="麦克风">
        <i class="tool-icon" :class="[microphoneMuted ? 'icon-mdi-moff' : 'icon-mdi-mic']"></i>
        <span>语音</span>
      </a>
      <!-- 扬声器开关 -->
      <a href="javascript:;" class="tool-item" @click="handleMute()" title="扬声器">
        <i class="tool-icon" :class="[volumeMute ? 'icon-mdi-volume-down' : 'icon-mdi-volume-up']"></i>
        <span>扬声器</span>
      </a>
      <!-- 全屏 -->
      <a href="javascript:;" class="tool-item" @click="handleFullScreen()" title="全屏">
        <i class="tool-icon" :class="[fullScreen ? 'icon-mdi-fullscreen-exit' : 'icon-mdi-fullscreen']"></i>
        <span>全屏</span>
      </a>
      <!-- 显示/隐藏 参会者列表 -->
      <a href="javascript:;" class="tool-item pull-right toggle-sidebar" @click="toggleSideBar()">
        <i class="tool-icon" :class="[sideBarState ? 'icon-arrow-right' : 'icon-arrow-left']"></i>
      </a>
      
    </div>
</template>

<script>
  import rtcMain from '../util/webrtc/lib/svocRTCMain';
  import {common} from '../util/common';
  export default {
    name: 'Toolbar',
    data() {
      return {
        cameraMuted: false,
        microphoneMuted: false,
        volumeMute: false,
        volumeValue: 1,
        fullScreen: false,
        sideBarState: true
      }
    },
    methods: {
      // 摄像头
      handleCamera() {
        rtcMain.muteVideo();
        this.cameraMuted = !this.cameraMuted;
      },
      // 麦克风
      handleMicrophone() {
        rtcMain.muteAudio();
        this.microphoneMuted = !this.microphoneMuted;
      },
      // 扬声器
      handleMute() {
        if(this.volumeValue > 0) {
          this.volumeValue = 0
          this.volumeMute = true;
        }else{
          this.volumeValue = 1;
          this.volumeMute = false;
        }
        this.$store.commit('setLocalVolume', this.volumeValue);
        // this.volumeMute = !this.volumeMute;
      },
      // 全屏
      handleFullScreen() {
        let element = document.documentElement;
        common.fullScreen(element);
        
        this.fullScreen = !this.fullScreen;
        // this.fullScreen = !this.fullScreen;
      },
      // 显示/隐藏 右侧参会者列表
      toggleSideBar() {
        this.sideBarState = !this.sideBarState;
        this.$store.commit('setSideBarState', this.sideBarState);
      },

    },
    
  }
</script>

<style scoped>
/* 工具操作部分 */
.tool-bar-center{
  text-align: center;
}
.toggle-sidebar{
  margin: 14px 5px;
}
</style>