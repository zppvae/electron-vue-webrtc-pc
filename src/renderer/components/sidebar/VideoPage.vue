<template>
<!-- 视频设置 -->
  <div class="videoPage">
    <div class="sidebar-left">
      <span>摄像头</span>
      <el-select v-model="videoSource" placeholder="请选择摄像头" @change="chooseDevicesFn('videoSource', videoSource)">
        <el-option
        v-for="list in deviceList.videoSelect"
        :key="list.deviceId"
        :label="list.text"
        :value="list.deviceId"
        ></el-option>
      </el-select>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "videoPage",
  data() {
    return {
      videoSource: '',
    }
  },
  computed: {
    ...mapGetters('devicesInfo',{ 
        deviceList: 'getDevicesInfoList'
    }),
    ...mapGetters('devicesInfo',{ 
        deviceInfo: 'getDevices'
    }),
  },
  methods: {
    // 获取可用摄像头列表
    _gotDevices(){
      // 默认选中第一个
      this.videoSource = this.deviceInfo.videoSource;
    },
    // 选择摄像头
    chooseDevicesFn(type, deviceid) {
      this.$store.commit("devicesInfo/setDevices", {name: type, value: deviceid});
    }
  },
  created() {
    console.log("进入VideoPage");
  },
  mounted() {
    console.log("VideoPage加载完成");
    this._gotDevices()
  }
};
</script>

<style>
  .sidebar-left{
    margin-left: 1rem;
  }
  .sidebar-left span{
    margin: 0 1rem;
  }
</style>