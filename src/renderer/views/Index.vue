<template>
  <div class="index">
    <el-row>
      <el-col class="main" :span="18">
        <div class="middle">
          <div class="video">
            <video id="localVideo" class="localvideo" autoplay></video>
          </div>
        </div>
        <div class="setup">
          <i class="fa fa-cog" title="设置" @click="handleSetting()"></i>
        </div>
      </el-col>
      <el-col class="JoinForm" :span="6">
        <JoinMeeting v-if="hackReset" />
      </el-col>
    </el-row>

    <Sidebar ref="sidebar"/>
  </div>
</template>

<script>
import Sidebar from "@/components/Sidebar.vue";
import JoinMeeting from "@/components/JoinMeeting.vue";
import getUserMedia from '../util/webrtc/getUserMedia';
import getMediaDevices from '../util/webrtc/getMediaDevices'
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: "index",
  data() {
    return {
      hackReset: true,
      constraints: {},
      localVideo: '',
      localStream: '',
      deviceList: {
        audioInputSelect: [],
        audioOutputSelect: [],
        videoSelect: []
      },
      // deviceInfo: this.$store.getters.getDevices
    };
  },
  computed: {
    ...mapGetters('devicesInfo', {
      deviceInfoIds: 'getDevices'
    }),
    ...mapGetters({
      'watchServerAddress': 'getServerAddress',
      'watchIsLoggedIn': 'getIsLoggedIn'
    })
    // watchServerAddress() {
    //   return this.$store.getters.getServerAddress;
    // },
    // watchIsLoggedIn() {
    //   return this.$store.getters.getIsLoggedIn;
    // }
  },
  components: {
    Sidebar,
    JoinMeeting
  },
  methods: {
    // 设置
    handleSetting() {
      this.$refs.sidebar.settingShow();
    },
    // 获取本地媒体摄像头
    getUserMediaFn(devices) {
      // const devices = this.$store.getters.getDevices;
      const _localVideo = document.querySelector("#localVideo");
      let constraints;
      
      if(devices) {
        constraints = {
          video: { deviceId: devices.videoSource || ''}, 
          audio: { deviceId: devices.audioSource || '' }
        };
      }else {
        constraints = {
          video: { deviceId: ''}, 
          audio: { deviceId: '' }
        }
      }
      
      getUserMedia(constraints)
      .then((stream)=>{
        this.localStream = stream;
        _localVideo.srcObject = this.localStream;
      })
      .catch((error)=>{
        console.error('获取本地媒体失败-----', error)
      })
    },

    // 获取可用麦克风/扬声器列表
    getMediaDevicesFn() {
      getMediaDevices()
      .then((deviceInfos)=>{
        this.gotDevices(deviceInfos)
      })
      .catch((error)=>{
        console.log(error)
      })
    },
    gotDevices(deviceInfos){
      for (let i = 0; i < deviceInfos.length; i++) {
        let deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === 'audioinput') {
          deviceInfo.text = deviceInfo.label || `microphone ${this.deviceList.audioInputSelect.length + 1}`;
          this.deviceList.audioInputSelect.push(deviceInfo);
        } else if (deviceInfo.kind === 'audiooutput') {
          deviceInfo.text = deviceInfo.label || `speaker ${this.deviceList.audioOutputSelect.length + 1}`;
          this.deviceList.audioOutputSelect.push(deviceInfo);
        }else if (deviceInfo.kind === 'videoinput') {
          deviceInfo.text = deviceInfo.label || `camera ${this.deviceList.videoSelect.length + 1}`;
          this.deviceList.videoSelect.push(deviceInfo);
        }
      }
      this.$store.dispatch('devicesInfo/asynDevicesInfoList', this.deviceList);
      // 默认选择第一个设备
      this.setDefaultDevice('audioSource', this.deviceList.audioInputSelect[0].deviceId);
      this.setDefaultDevice('audioOutput', this.deviceList.audioOutputSelect[0].deviceId);
      this.setDefaultDevice('videoSource', this.deviceList.videoSelect[0].deviceId);
    },
    setDefaultDevice(type, deviceid) {
      this.$store.commit("devicesInfo/setDevices", {name: type, value: deviceid});
    }

  },
  watch: {
    // watch 媒体设备改变 深度监听
    deviceInfoIds: {
      handler(curval) {
        this.getUserMediaFn(curval)
      },
      deep:true
    },
    // watch 服务器地址改变
    watchServerAddress() {
      this.hackReset = false;
      this.$nextTick(() => {
       this.hackReset = true; //重建组件
     });
     console.log('joinMeeting 重建组件',this.hackReset);
    },
    // watch 用户状态改变 登录/退出
    watchIsLoggedIn() {
      this.hackReset = false;
        this.$nextTick(() => {
        this.hackReset = true; //重建组件
      });
      console.log('joinMeeting 重建组件',this.hackReset);
    }
  },
  created() {
    console.log("进入index");
  },
  mounted() {
    console.log("index加载完成");
    this.getMediaDevicesFn();
    this.getUserMediaFn();
  }
};
</script>
<style>
.main {
  position: fixed;
  height: 100%;
  left: 0;
  top: 0;
}
.localvideo{
  width: 100%;
  /* height: 100%; */
}

.JoinForm {
  position: fixed;
  height: 100%;
  right: 0;
  top: 0;
}
.middle {
  height: 100%;
  padding-bottom: 50px;
}
.video {
  height: 100%;
  /* overflow-x: scroll; */
  border-bottom: 1px solid #ccc;
  background: #000;
}
.setup {
  height: 50px;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  line-height: 50px;
  background-color: #303847;
}
.setup i{
  font-size: 22px;
  position: absolute;
  top:15px;
  left: 15px;
  color: beige;
  cursor: pointer;
}
</style>