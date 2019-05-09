<template>
  <div class="Sidebar">
    <Drawer width="26%" title="设置" placement="left" :closable="true" v-model="setting">
      <ul class="left_menu">
        <li @click="twoSidebarShow('login')">
          <template v-if="!$store.state.isLoggedIn">
            <i class="fa fa-user"></i>未登录
          </template>
          <template v-if="$store.state.isLoggedIn">
            <i class="fa fa-user"></i>{{loginData.realName}}
          </template>
        </li>
        <li @click="twoSidebarShow('video')">
          <i class="fa fa-video-camera"></i>视频
        </li>
        <li @click="twoSidebarShow('audio')">
          <i class="fa fa-microphone"></i>音频
        </li>
        <li @click="twoSidebarShow('definition')">
          <i class="fa fa-rss"></i>呼叫速率
        </li>
        <li @click="twoSidebarShow('server')">
          <i class="fa fa-cogs"></i>设置服务器
        </li>

        <li v-if="$store.state.isLoggedIn" class="logout-menu">
          <el-button type="text" @click="logoutFn()">退出登录</el-button>
        </li>
      </ul>
    </Drawer>
    <Drawer
      width="26%"
      :title="twoTitle"
      placement="left"
      :closable="true"
      v-model="twoShow"
      :mask-closable="true"
      @on-close="hideTwo()"
    >
      <!-- <Login ref="login" :loginShowAfter="loginShowAfter"/> -->
      <router-view/>
      <div class="back">
        <i class="fa fa-arrow-left" @click="hideTwo()"></i>
      </div>
    </Drawer>
  </div>
</template>

<script>
// import Login from "./Login.vue";
import VueCookies from "vue-cookies";
import { common } from "../util/common.js";


export default {
  name: "Sidebar",
  props: {},
  data() {
    return {
      setting: false,
      twoShow: false,
      loginData: common.getLoginMsg(),
      twoTitle: ""
    };
  },
  computed: {
    isLogined(){
      return this.$store.getters.getIsLoggedIn
    }
  },

  methods: {
    settingShow() {
      this.setting = true;
    },
    twoSidebarShow(name) {
      switch (name) {
        case "login":
         !!this.isLogined ? (this.twoTitle = "个人信息") : (this.twoTitle = "登 录");
          // (this.loginData = common.getLoginMsg()),
          //   !this.loginData
          //     ? (this.twoTitle = "登陆")
          //     : (this.twoTitle = "个人信息");
          break;
        case "video":
          this.twoTitle = "视频设置";
          break;
        case "audio":
          this.twoTitle = "音频设置";
          break;
        case "definition":
          this.twoTitle = "呼叫速率";
          break;
        case "server":
          this.twoTitle = "设置服务器";
          break;
        default:
          break;
      }
      this.twoShow = true;
      this.$router.push("/index/" + name);
    },

    //隐藏侧边栏的二级目录
    hideTwo() {
      this.$router.push("/index");
    },

    /** 退出登录 */
    logoutFn() {
        const _this = this;
        this.$electron.ipcRenderer.send('logout-dialog')
        this.$electron.ipcRenderer.on('logout-dialog-selection', function (event, index) {
          if(index === 0) {
            _this.sureLogoutFn();
          }
        })
    },
    // 确定退出登录
    sureLogoutFn() {
      this.$post('/uc/logout', '')
        .then(res => {
          let { code } = res;
          if (code == 200) {
            common.deletAllLoginData()//清除所有登录信息
            this.$notification('退出', '退出登录成功');
            this.$store.commit("setIsLoggedIn", false);
            this.$store.dispatch('asyncLoginData', {});
            // window.location.reload();
            // 退出登录成功后返回到index
            this.$router.push('/index');
          }
        })
        .catch(error => {
          let { msg } = error.response.data;
          console.log(msg);
        });
    },
  },
  watch: {
    $route(now, old) {
      //监控路由变换，控制二级目录的显示
      if (now.path == "/index") {
        this.twoShow = false;
        this.loginData = common.getLoginMsg();
      }
    }
  },
  created() {
    console.log("进入sidebar");
  },
  mounted() {
    console.log("sidebar加载完成");
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ul {
  list-style-type: none;
}
.left_menu li {
  font-size: 16px;
  line-height: 60px;
  padding-left: 20px;
}
.left_menu li:hover {
  cursor: pointer;
  background-color: #303847;
}
.left_menu li i {
  margin-right: 5px;
  font-size: 18px;
  width: 20px;
}
.back {
  position: absolute;
  bottom: 0;
  width: 100%;
  left: 0;
}
.back i {
  font-size: 20px;
  margin: 5px 5px 5px 15px;
  padding: 5px 8px;
  cursor: pointer;
}
.logout-menu{
  text-align: center;
  margin-left: -20px;
}
</style>
