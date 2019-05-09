<template>
  <!-- 音频设置 -->
  <div class="audioPage">
    <!-- Audio input -->
    <div class="sidebar-left">
      <span>麦克风</span>
      <el-select v-model="audioForm.audioSource" placeholder="请选择麦克风" @change="chooseDevicesFn('audioSource', audioForm.audioSource)">
        <el-option
        v-for="list in deviceList.audioInputSelect"
        :key="list.deviceId"
        :label="list.text"
        :value="list.deviceId"
        ></el-option>
      </el-select>
    </div>
    <!-- Audio output -->
    <div class="sidebar-left">
      <span>扬声器</span>
      <el-select v-model="audioForm.audioOutput" placeholder="请选择扬声器" @change="chooseDevicesFn('audioOutput', audioForm.audioOutput)">
        <el-option
        v-for="list in deviceList.audioOutputSelect"
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
  name: "audioPage",
  data() {
    return {
      audioForm: {
        audioSource: '',
        audioOutput: ''
      },
      // deviceList: {
      //   audioInputSelect: [],
      //   audioOutputSelect: []
      // }
    }
  },
  computed: {
    
    ...mapGetters('devicesInfo',{ //用mapGetters来获取devicesInfo.js里面的getters getDevicesInfoList
        deviceList: 'getDevicesInfoList'
    }),
    ...mapGetters('devicesInfo',{ //用mapGetters来获取devicesInfo.js里面的getters getDevices
        deviceInfo: 'getDevices'
    }),
  },
  methods: {
    // 获取可用麦克风/扬声器列表
    _gotDevices(){
      // 默认选中第一个
      this.audioForm.audioSource = this.deviceInfo.audioSource;
      this.audioForm.audioOutput = this.deviceInfo.audioOutput;
    },
    // 选择麦克风/扬声器
    chooseDevicesFn(type, deviceid) {
      this.$store.commit("devicesInfo/setDevices", {name: type, value: deviceid});
    }
  },
  created() {
    console.log("进入AudioPage");
  },
  mounted() {
    console.log("AudioPage加载完成");
    this._gotDevices()
  }
 };
</script>

<style scoped>
  
</style>