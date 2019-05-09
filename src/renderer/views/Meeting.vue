<template>
  <div class="">
      <!-- 会议主画面 -->
      <div class="meeting-stage" :class="{ 'fullmeeting': !sideBar}">
        <!-- header -->
        <div class="meeting-bar header-bar">
          <el-row type="flex" class="row-bg" justify="space-around">
            <el-col :sm="6" :md="4">
              <div class="conference-msg">
                <el-popover
                  placement="top-start"
                  trigger="hover">
                  <span slot="reference">{{conferenceDetail.conference.conferenceName}} <i class="icon-arrow-right" style="font-size:14px;"></i></span>
                  <div>
                    <p>会议号：{{ conferenceDetail.conference.vmrNumber }}</p>
                    <p>密  码：{{ conferenceDetail.conference.visitorPwd }}</p>
                    <p>发起人：{{ conferenceDetail.conference.s.realName }}</p>
                  </div>
                </el-popover>
              </div>
            </el-col>
            <el-col :sm="10" :md="16" >
              <div class="conference-status">
                <el-tooltip class="item" effect="light" content="入会时长" placement="bottom">
                  <span>{{meetingTimer.timeLong}}</span>
                </el-tooltip>
                <span>|</span>
                <span class="network" @click="getMediaStatistics()">
                  <i class=" icon-conference-network" :class="{'network-good':percentageLost<=10, 'network-general': percentageLost>10 && percentageLost<20, 'network-bad':percentageLost>=20}"></i>
                  <span v-if="percentageLost<=10">网络良好</span>
                  <span v-if="percentageLost>10 && percentageLost<20">网络一般</span>
                  <span v-if="percentageLost>=20">网络不佳</span>
                </span>
              </div>
            </el-col>
            <el-col :sm="4" :md="3" >
              <div class="">
                <!-- 挂断 -->
                <a href="javascript:;" class="tool-item disconnect-btn" @click="disconnectDialog=true">
                  <i class="tool-icon icon-mdi-call-end"></i>
                </a>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- main -->
        <div class="conn-main">
          <!-- 本地画面 -->
          <div class="right-video local-video">
            <video id="localVideo" class="" autoplay />
          </div>

          <!-- 远端画面 -->
          <div class="main-video remote-video">
            <video v-show="!spinnerTimer" id="remoteVideo" class="" autoplay  v-rtcVolume="$store.getters.getLocalVolume" />

            <img v-show="spinnerTimer" class="presentation-image" src="../assets/img/video-spinner.svg" />
          </div>


          <!-- 双流画面 -->
          <!-- todo -->
        </div>

        <!-- 底部操作栏 -->
        <div class="meeting-bar tool-bar">
          <Toolbar />
        </div>
      </div>

      <!-- 参会者列表 -->
      <div class="side-bar" :class="{ 'hide-sidebar': !sideBar}">
        <ParticipantList />
      </div>

      <!-- 挂断 弹出框 -->
      <el-dialog
        title="挂断"
        :visible.sync="disconnectDialog"
        width="400px">
        <span>结束会议之后，参会人员将被强制退出会议。</span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="disconnectDialog = false">取 消</el-button>
          <el-button v-if="havePermission"  type="primary" @click="closeConference()">结束会议</el-button>
          <el-button type="primary" @click="disconnect()">离开会议</el-button>
        </span>
      </el-dialog>

      <!-- 网络状态 弹出框 -->
      <el-dialog
        :visible.sync="statisticsDialog"
        width="500px"
        :modal="false"
        custom-class='statics-dialog'
        >
        <div >
          <el-row>
            <!-- <h4>呼出</h4> -->
            <ul id="outgoing">
              <li class="statistics-type" v-for="(mediatype_data, direction) in statisticsObj" :key="direction" style="padding-left:60px;">
                <p class="statistics-direction">{{direction | translateStatic}}</p>
                <div class="statistics-data" v-for="(stats, mediatype) in mediatype_data" :key="mediatype">
                  <p class="statistics-media-type">{{mediatype | translateStatic}}</p>
                  <ul>
                    <li v-for="(value, key) in stats" :key="key">
                      {{key | translateStatic}}： {{value}}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </el-row>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="closeStatisticsDialog()">关闭</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
import ParticipantList from "@/components/ParticipantList.vue";
import Toolbar from "@/components/Toolbar.vue";
// import rtcMain from '../util/webrtc/lib/svocRTCMain';
import rtc from '../util/webrtc/lib/svocRTC';
import { common } from '../util/common';
import { setInterval, clearInterval } from 'timers';
import { conferenceApi } from '../server/api';
import { xmpp } from '../util/xmpp';

export default {
  name: "meeting",
  data() {
    return {
      disconnectDialog: false, // 挂断模态框
      statisticsDialog: false, // 会议状态模态框
      havePermission: false,
      cid: '', // cid
      // 入会时长
      meetingTimer: {
        timerInterval: null,
        timeLong: '00:00:00',
        backH: 0,
        backM: 0,
        backS: 0
      },
      // 丢包率
      percentageLost: 0,
      percentageLostInterval: null,
      // 会议状态
      streamStatistics: {},
      statisticsObj: {outgoing: {}, incoming: {}},
      statisticsInterval: null,
      localVolume: this.$store.getters.localVolume || '1',
      _sideBar: this.$store.getters.getSideBarState,
      spinnerTimer: true
    };
  },
  components: {
    ParticipantList,
    Toolbar
  },
  computed: {
    // 从状态管理器中获取会议信息
    conferenceDetail: function () {// 获取getters
      const _conferenceRole =this.$store.getters.getConferenceRoleData;
      if(_conferenceRole.conferenceRole === 0) {
          this.havePermission = false;
      }else{
          this.havePermission = true;
      }
      const _conferenceDetail = this.$store.getters.getConferenceData;
      this.cid = _conferenceRole.cid;
      return _conferenceDetail;
    },
    sideBar: function () {
      return this.$store.getters.getSideBarState;
    }
  },
  watch: {
    spinnerTimer(curVal) {
      if(curVal === false) {
        this.getPercentageLost()
      }
      // console.log('当前值---', curVal);
    }
  },
  methods: {
    // 结束会议
    closeConference(){
      conferenceApi.closeConference(this.cid)
      .then(res => {
        this.Hint('结束会议成功', 'success')
        this.disconnect()
      })
      .catch(error => {
        this.Hint('结束会议失败', 'error')
      })
    },
    // 离开会议
    disconnect() {
      rtc.disconnect();
      this.disconnectDialog = false;
      xmpp.disConnectXmpp();
      clearInterval(this.percentageLostInterval);
      this.$router.push('/index');
      // window.location.reload();
    },

    // 入会时长 定时器
    timeBackTimerFn() {
      this.meetingTimer.backS++;
      if(this.meetingTimer.backS == 12){
        this.spinnerTimer = false;
      }
      if(this.meetingTimer.backS == 60) {
        this.meetingTimer.backS = 0;
        this.meetingTimer.backM++;
      }
      if(this.meetingTimer.backM == 60) {
        this.meetingTimer.backM = 0;
        this.meetingTimer.backH++;
      }

      return common.addZero(this.meetingTimer.backH) + ':' + common.addZero(this.meetingTimer.backM) + ':' + common.addZero(this.meetingTimer.backS)
    },
    // 获取丢包率
    getPercentageLost() {
      this.percentageLostInterval = setInterval(() => {
        const _statistics = rtc.getCallStatistics();
        this.streamStatistics = _statistics;
        if(_statistics.incoming) {
          this.percentageLost = parseFloat(_statistics.incoming.video['percentage-lost'])
        }
      }, 4000);
    },
    // 流信息
    getMediaStatistics() {
      this.statisticsDialog = true;
      this.statisticsObj = this.streamStatistics;
      this.statisticsInterval = setInterval(() => {
        const _statistics = rtc.getCallStatistics();
        this.statisticsObj = _statistics;
        // console.log("_statistics======", _statistics)
      }, 1000);
    },
    closeStatisticsDialog() {
      this.statisticsDialog = false;
      if(this.statisticsInterval){
        clearInterval(this.statisticsInterval);
        this.statisticsInterval = null;
      }
    }
  },

  mounted() {
    console.log("Meeting加载完成");
    this.meetingTimer.timerInterval = setInterval(() => {
      this.meetingTimer.timeLong = this.timeBackTimerFn()
    }, 1000);
  },
  destroyed() {
    clearInterval(this.meetingTimer.timerInterval);
    clearInterval(this.statisticsInterval);
    if(this.percentageLostInterval) {
      clearInterval(this.percentageLostInterval);
      this.percentageLostInterva = null;
    }
  }
};
</script>
<style>
.meeting-stage{
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 300px;
  color: #FAFAFA;
  background-color: rgb(163, 209, 240);
  text-align: center;
  overflow: hidden;
  opacity: 1;
  /* height: 100%;
  width: 100%; */
}
.meeting-stage.fullmeeting{
  right: 0;
}
/* 参会者列表 */
.side-bar{
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  transition-property: left;
  transition-duration: 0.5s;
  background: #3f4a5d !important;
  color: #fff;
  width: 300px;
  overflow: auto;
}
.hide-sidebar{
  overflow: hidden;
  width: 0;
  /* display: none; */
}
.meeting-bar{
  position: absolute;
  background: #303847;
  height: 60px;
  width: 100%;
  z-index: 999;
  box-shadow: 0 0px 12px #888;
  /* line-height: 60px; */
}
.header-bar{
  top: 0;
  line-height: 60px
}
.tool-bar{
  bottom: 0;
  left: 0;
}
/** header **/
.conference-msg{
  float: left;
  font-size: 16px;
  cursor: pointer;
}
.disconnect-btn{
  float: right;
  margin: 10px 0;

}
.disconnect-btn i.tool-icon{
  font-size: 32px;
}
.conference-status span{
  margin: 0 5px;
  font-size: 16px;
}
.network{
  cursor: pointer;
}
.network i.network-bad{
  color: red;
}
.network i.network-good{
  color: #1fca1f;
}
.network i.network-general{
  color: #f7e83b;
}
div.el-dialog.statics-dialog{
  background: rgba(0, 0, 0, 0.68);
  box-shadow: 0 0 5px #f2f2f2;
}
.statics-dialog .el-dialog__body{
  color :#f2f2f2;
}

/* 视频主体部分 */
.conn-main{
  height: 100%;
  background: #000;
}
.video-div{
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  transform: translate(-50%,-50%);
  text-align: center;
}
.main-video{
  position: absolute;
  margin: auto;
  top: 50px;
  bottom: 50px;
  left: 0;
  right: 0;
  max-width: 100%;
  max-height: 100%;
  text-align: center;
  white-space: nowrap;
  background: #000;
}
.main-video video {
  width: 100%;
  height: 100%;
}
.main-video .presentation-image{
  display: inline-block;
  height: 20%;
  width: 100%;
  vertical-align: middle;
  border: 0;
  margin: 0;
  padding: 0;
  background-color: inherit;
}

.main-video:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -0.25em;
}
.right-video{
  position: absolute;
  top: 70px;
  right: 10px;
  width: 20%;
  /* width: 240px;
  height: 210px; */
  background-color: transparent;
  z-index: 999;
}
.right-video video {
  width: 100%;
  height: 100%;
}

/*  媒体流信息 */
.statistics-type{
  display: inline-block;
}
.statistics-direction {
  font-size: large;
  font-weight: bold;
}
.statistics-media-type {
  font-weight: bold;
  margin: 16px 0 8px 0;
}
.statistics-data {
  /*margin: 16px;*/
}
.statistics-data ul {
  width: 100%;
  font-size: smaller;
}
.statistics-data ul li:first-of-type {
  text-align: left;
}
</style>
