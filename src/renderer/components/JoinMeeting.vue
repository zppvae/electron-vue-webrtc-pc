<template>
  <div class="joinMeeting">
    <div class="joinForm">
      <h2>加入会议</h2>
      <p>
        <el-input v-model="meetingInfoData.conference" placeholder="请输入会议号" autocomplete="off"></el-input>
      </p>
      <p>
        <el-input v-model="meetingInfoData.pin" show-password placeholder="请输入会议密码" autocomplete="off"></el-input>
      </p>
      <p v-if="!$store.state.isLoggedIn">
        <el-input v-model="meetingInfoData.realName"></el-input>
      </p>

      <p>
        <el-button @click="handleJoinMeetingFn()" type="primary">加入会议</el-button>
      </p>
    </div>
  </div>
</template>

<script>
import { common } from "../util/common.js";
// import rtcMain from '../util/webrtc/lib/svocRTCMain';
import rtc from '../util/webrtc/lib/svocRTC';
import { xmpp } from '../util/xmpp.js';
import { conferenceApi } from '../server/api.js';
import { mapState, mapGetters, mapActions } from 'vuex';


export default {
  name: "joinMeeting",
  data() {
    return {
      userInfoData: this.$store.state.loginData, //用户信息
      divecesIds: {},
      pinRequired: null,
      // 会议信息
      meetingInfoData: {
        realName: '', // 用户姓名
        name: '', // apiuserId
        conference: '',// 会议号 this.meetingInfoData.uri
        host: '', // 请求pex的接口地址  webRtcAddress
        pin: '', // pin
        call_type: 'video',
        bw: ''
      }
    };
  },
  computed: {
    ...mapGetters('devicesInfo', {
      _divecesIds: 'getDevices'
    })
    
  },
  watch: {
    
  },
  methods: {
    // 判断检测是否为匿名入会
    checkAnonymous() {
      // 检查是否存在历史呼叫记录
      this.meetingInfoData.conference = this.$cookies.get('prevConferenceNum');
      let isAnonymous = this.$store.state.isLoggedIn && this.$store.state.loginData;
      // 匿名用户 调用接口获取getJwtToken
      if(!isAnonymous) {
        conferenceApi.getJwtTokenNo(this.meetingInfoData.realName)
        .then(res => {
          // 保存xmpp信息
          const _xmppdata = {
            userId: res.userId,
            webRtcAddress: res.webRtcAddress,
            xmppUsername: res.xmppUsername,
            xmppPassword: res.xmppPassword,
            webrtcXmppIp: res.webrtcXmppIp,
            xmppServer: res.xmppServer
          };
          this.$store.dispatch('asyncXmppData', _xmppdata);

          this.meetingInfoData.host = res.webRtcAddress;
          this.meetingInfoData.name = res.apiUserId.toString();
          console.log("meetingInfoData 匿名用户 ----", this.meetingInfoData)
        })
      } else {
        // 已登录用户 调用接口获取getJwtToken
        conferenceApi.getJwtToken()
        .then(data => {
          this.meetingInfoData.host = data.webRtcAddress;
          this.meetingInfoData.realName = data.realName;
          this.meetingInfoData.name = data.apiUserId.toString();
        });
        console.log("meetingInfoData 已登录用户----", this.meetingInfoData)
      }
      // 接口获取 turn_server
      conferenceApi.getTurnServer();
    }, 

    // 加入会议按钮操作
    handleJoinMeetingFn() {
      // const nodeServer = this.$store.state.serverAddress.split('//')
      // this.meetingInfoData.host = nodeServer[1];
      
      // 当前选择到带宽值
      this.meetingInfoData.bw = this.$store.getters.getResolution;
      
      this.checkJoin()
    },
    // 判断入会方式 并获取会议信息
    checkJoin() {
      let _this = this;
      let joinPromise;
      // 1.加入会议接口请求（匿名 or 已登录）
      if(this.userInfoData && this.$store.state.isLoggedIn){
        joinPromise = conferenceApi.join(this.meetingInfoData.conference, this.meetingInfoData.pin, this.userInfoData.entId, 0);
      }else{
        joinPromise = conferenceApi.anonymousLogin(this.meetingInfoData.conference, this.meetingInfoData.pin, this.meetingInfoData.realName);
      }
      // 接口返回200 
      joinPromise.then(res => {
        // 2.将加入会议返回的数据 异步保存到状态管理器 
        _this.$store.dispatch('asyncConferenceRoleData', res);
        // 初始化rtc api请求，request_token;
        rtc.init(this.meetingInfoData.host, this.meetingInfoData.conference, this.meetingInfoData.name, this.meetingInfoData.pin);
        // 赋值设备id
        this.meetingInfoData.audioSourceId = this._divecesIds.audioSource;
        this.meetingInfoData.videoSourceId = this._divecesIds.videoSource;
        // 将设备id传到rtc api中
        rtc.startCall('video', this._divecesIds.videoSource, this._divecesIds.audioSource);

        // 3.获取当前会议到详细数据
        conferenceApi.conferenceInfo(res.cid)
        .then((resdata) => {
          // 成功后 将会议信息异步保存到状态管理器中
          _this.$store.dispatch('asyncConferenceData', resdata);
          // 页面路由跳转
          _this.$router.push('/meeting');
          // 从状态管理器中获取xmpp连接信息 并初始化连接
          _this.$store.getters.xmppInit;
        }).then((res) => {

          // 4.将当前呼叫的会议室加入历史记录，并保存到cookie，便于下次呼叫自动填充
          this.$cookies.set('prevConferenceNum', this.meetingInfoData.conference);
        });

        // 5.获取参会者列表数据
        conferenceApi.getParticipants(res.cid, this.meetingInfoData.conference)
        .then(reslist => {
          // 将参会者列表返回的数据 异步保存到状态管理器 
          _this.$store.dispatch('asyncParticipantsData', reslist.list);
        })
      }).catch((err) => {
        // error处理
        _this.Hint(err.msg, 'error');
      })
    }

  },
  created() {
    console.log("进入joinMeeting");
    if(this.$store.state.isLoggedIn){
      this.meetingInfoData.realName = this.userInfoData.realName;
    }else{
      this.meetingInfoData.realName = common.createAnonymousName();
    }
    // create后 立即检测是否为匿名入会
    this.checkAnonymous();
  },
  mounted() {
    console.log("joinMeeting加载完成");
    
  }
};
</script>

<style>
.joinMeeting{
  height: 100%;
  background: linear-gradient(to bottom, #23384e, #373737);
}
.joinForm {
  margin: 0 auto;
  padding-top: 50px;
  width: 90%;
}
.joinForm h2 {
  text-align: center;
}
.joinForm p {
  margin: 20px 0;
  text-align: center;
}
</style>