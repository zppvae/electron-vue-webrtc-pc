<template>
  <div class="side-bar">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>参会者（{{participantsList.OnlineNum}} / {{participantsList.allMemberLength}}）</span>
        <!-- <el-button style="float: right; padding: 3px 0" type="text">操作按钮</el-button> -->
      </div>

      <div calss="participants-list">
        <div v-for="participant in participantsList.list" :key="participant.userId + participant.displayName" class="list-item">
          <div :class="{'1' : 'active', '0' : 'inactive'}[participant.isOnline]">
            <div class="avatar head-avatar">
              <span class="avatar-color" :class="participant.colors">{{ participant.displayName | limitTo }}</span>
            </div>
            <p class="participant-list">
              <span class="list-name">
                {{participant.displayName}}
                <span v-show="participant.role == 4001 && participant.isOnline==1">[主讲人]</span>
                <span v-show="participant.flowFlag == 1" class="green">[共享中]</span>
                <span v-show="participant.isHandsUp == 1" class="green">[举手中]</span>
              </span>
              <span class="list-detail">
                <i class="participant-state green icon-mdi-mic" v-if="participant.isMuted==0"></i>
                <i class="participant-state red icon-mdi-moff" v-if="participant.isMuted==1"></i>
                <!-- <i class="participant-state green icon-conference-collected" v-if="participant.isCollected==1"></i>
                <i class="participant-state red icon-conference-unCollected" v-if="participant.isCollected==0"></i> -->
              </span>
            </p>
            <el-popover
              placement="left"
              trigger="click">
              <i slot="reference" class="pull-right icon-conference-more list-dot"></i>
              <div class="operation">
                <ul v-if="participant.isOnline == 1">
                  <li v-if="havePermission" @click="participantMute(participant)"> {{participant.isMuted==0 ? '静音' : '解除静音'}}</li>
                  <li v-if="havePermission" @click="setRole(participant)"> {{ participant.role==4001 ? '取消主讲人': '设为主讲人'}}</li>
                  <li v-if="havePermission" class="red" @click="participantDisconnect(participant)">挂断</li>
                  <li class="disabled" v-else-if="!havePermission">无操作权限</li>
                </ul>
                <ul v-if="participant.isOnline == 0">
                  <li v-if="havePermission" @click="callParticipant(participant)">呼叫</li>
                  <li class="disabled" v-else-if="!havePermission">无操作权限</li>
                </ul>
              </div>
            </el-popover>

          </div>

        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
  import { conferenceApi } from '../server/api.js';
  export default {
    name: 'ParticipantList',
    data() {
      return {
        cid: '',
        conferenceRole: {},
        // 是否有权限操作参会者
        havePermission: false,
        isCanCollect: 0 // 是否可以被收藏  0否；1是
      }
    },
    computed: {
      participantsList: function () { // 获取getters
        let _participantsList = {
          OnlineNum: 0, // 在线人数
          allMemberLength: 0, // 总人数
          list: []
        };

        //  会议信息
        const _conferenceDetail = this.$store.getters.getConferenceRoleData;
        this.conferenceRole =  _conferenceDetail;
        this.cid = _conferenceDetail.cid;
        if(_conferenceDetail.conferenceRole === 0) {
          this.havePermission = false;
        }else{
          this.havePermission = true;
        }

        // 参会者
        const allParticipants = this.$store.getters.getParticipantsData || [];
        _participantsList.allMemberLength = allParticipants.length;
        allParticipants.forEach(user => {
          if(user.isOnline == 1){
            user["colors"]="avatar-color"+Math.ceil(parseInt(user.userId)%10/2);
            _participantsList.OnlineNum += 1
          }
          _participantsList.list.push(user);
        });

        return _participantsList;
      },

    },
    methods: {

      /** 会控 **/
      // 静音/解除静音
      participantMute(participant) {
        let _type = null;
        if(participant.isMuted == 0){
          _type = true;
          participant.isMuted = 1;
        }else if(participant.isMuted == 1){
          _type = false;
          participant.isMuted = 0;
        }
        conferenceApi.setParticipantMute(this.cid, participant.puuid, _type)
        .then(res => {
          this.$notification('成功', _type ? '静音成功' : '解除静音成功');
        })
        .catch(error => {
          this.$notification('失败', '设置失败');
        })
      },
      // 设置主讲人/取消主讲人
      setRole(participant){
        let _role = participant.role;
        conferenceApi.setRole(this.cid, participant)
        .then(res => {
          if(_role === 4001) {
            participant.role = 4002
          }else if(_role === 4002){
            participant.role = 4001
          }
          this.$notification('成功', _role === 4002 ? '设置主讲人成功' : '取消主讲人成功');
        })
        .catch(error => {
          this.$notification('失败', '设置失败');
        })
      },
      // 呼叫参会者
      callParticipant(participant) {
        const _userId = participant.userId;
        conferenceApi.dialUsers(this.cid, _userId)
        .then(res => {
          this.$notification('呼叫', '呼叫成功');
        })
        .catch(error => {
          this.$notification('呼叫', '呼叫失败');
        })
      },
      // 挂断参会者
      participantDisconnect(participant) {
        let _puuid = participant.puuid;
        conferenceApi.participantDisconnect(this.cid, _puuid)
        .then(res => {
          this.$notification('挂断', '挂断成功');
        })
        .catch(error => {
          this.$notification('挂断', '挂断失败');
        })
      }
    },
    created() {
      console.log("进入ParticipantList");
    },
    mounted() {
      // this.getParticipants()
      console.log("ParticipantList加载完成");
    },
  }
</script>

<style scope>
  .side-bar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    transition-property: left;
    transition-duration: 0.5s;
    background: #3f4a5d !important;
    color: #fff;
    width: 300px;
  }
  .side-bar .el-card.box-card{
    background: transparent;
    color: #fff;
    border: none;
  }

  .list-item{
    padding: 10px 0;
  }
  /* 姓名 */
  .participant-list{
    display: inline-block;
    vertical-align: middle;

  }
  .participant-list .list-detail{
    display: block;

  }
  .participant-list .list-detail i.participant-state{
    display: inline-block;
    width: 20px;
    height: 16px;
  }


  /* // 更多操作 */
  .list-dot{
    line-height: 45px;
  }
  /* // 头像 */
  /* // 未在线 */
  .inactive .list-name{
    color:#ccc;
  }
  .inactive i.participant-state{
    color: #ccc;
  }
  .inactive .head-avatar span{
    background:#ccc;
    width:40px;
    height:40px;
    border-radius:50%;
    /* float:left; */
    text-align:center;
    line-height: 40px;
    margin-right:16px;
    color:#fff;
    pointer-events: none;
  }

  .avatar{
    display: inline-block;
  }
  .avatar-color {
    display: inline-block;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    text-align: center;
    line-height: 40px;
    margin: 0 10px;
    color: #fff;
    position: relative;
    font-size: 12px;
  }
  .avatar-color0{
    background:#a9d2f2;
  }
  .avatar-color1{
    background:#a9d2f2;
  }
  .avatar-color2{
    background:#c5b3eb;
  }
  .avatar-color3{
    background:#f3b2b2;
  }
  .avatar-color4{
    background:#a7dbc2;
  }
  .avatar-color5{
    background:#f7d4a3;
  }
  .operation ul{
    margin: 0;
  }
  .operation ul li{
    /* // border-top:1px solid #939393; */
    list-style: none;
    text-align:center;
    /* // color:#000; */
    padding: 0;
    line-height: 28px;
    cursor: pointer;
  }
  .operation ul li:hover{
    background: #f0f0f0;
  }
  .operation ul li.disabled{
    cursor: default;
  }
  .operation ul li.disabled:hover{
    background-color: transparent;
  }

</style>
