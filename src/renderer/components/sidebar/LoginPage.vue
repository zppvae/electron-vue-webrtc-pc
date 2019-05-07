<template>
<!-- 登录 -->
  <div class="loginPage">
    <div v-if="!isLogin" class="loginForm">
      <p>
        <el-input v-model="loginForm.username" placeholder="请输入邮箱或手机号"></el-input>
      </p>
      <p>
        <el-input v-model="loginForm.password" show-password placeholder="请输入密码"></el-input>
      </p>
      <p>
        <el-checkbox v-model="loginForm.isKeepLogin" style="color:#f2f2f2;">自动登录</el-checkbox>
      </p>
      <label class="red">{{loginMsg}}</label>
      <p style="text-align: center;">
        <el-button class="login-btn" @click="loginSubmit()" type="primary" round>登 录</el-button>
      </p>
    </div>
    <div v-if="isLogin" class="userInfo">
      <div class="textItem">
        <label>姓 名:</label>
        <span>{{userInformation.realName}}</span>
      </div>
      <div class="textItem">
        <label>公司/单位:</label>
        <span>{{userInformation.company}}</span>
      </div>
      <div class="textItem">
        <label>工 号:</label>
        <span>{{loginData.empno}}</span>
      </div>
      <div class="textItem">
        <label>一级部门:</label>
        <span>{{loginData.deptName}}</span>
      </div>
      <div class="textItem">
        <label>二级部门:</label>
        <span>{{loginData.subdeptName}}</span>
      </div>
      <div class="textItem">
        <label>三级部门:</label>
        <span>{{loginData.threedeptName}}</span>
      </div>
      <div class="textItem">
        <label>职 务:</label>
        <span>{{loginData.position}}</span>
      </div>
      <div class="textItem">
        <label>邮 箱:</label>
        <span>{{userInformation.email}}</span>
      </div>
      <div class="textItem">
        <label>手机号:</label>
        <span>{{userInformation.mobilePhone}}</span>
      </div>
    </div>
    <!-- <div v-if="loginData" class="logout">
      <el-button type="danger" plain @click="logoutFn()">退出</el-button>
    </div> -->
  </div>
</template>

<script>
import { common } from "../../util/common.js";

export default {
  name: "loginPage",
  data() {
    return {
      isLogin: this.$store.getters.getIsLoggedIn && !!this.$store.getters.getLoginData,
      loginForm: {
        captcha: "",
        username: "zhupp@svocloud.com",
        password: "123456",
        clientSecret:
          "MIICXQIBAAKBgQCxwfRs7dncpWJ27OQ9rIjHeBbkaigRY4in+DEKBsbmT3lpb2C6JQyqgxl9C+l5zSbONp0OIibaAVsLPSbUPVwIDAQABAoGAK76VmKIuiI2fZJQbdq6oDQ",
        isKeepLogin: true
      },
      loginMsg: "",
      loginData: this.$store.getters.getLoginData,
      // 用户信息
      userInformation: {}
    };
  },
  methods: {
    /** 登录 */
    loginSubmit() {
      var that = this;
      this.$post('/uc/login', this.loginForm)
        .then(res => {
          let { code, data, msg } = res;
          if (code == 200) {
            //保存user信息
            common.loginSetData(data);
            this.Hint('登录成功', 'success');
            this.$store.dispatch('asyncLoginData', data);
            this.$store.commit("setIsLoggedIn", true);
            
            that.loginMsg = "";
            // 登录成功后返回到index
            this.$router.push("/index");
            // window.location.reload();
          }
        })
        .catch(error => {
          let { msg } = error;
          that.loginMsg = msg;
          // this.Hint(msg, 'error');
        });
    },
    
    /** 获取已登录用户信息 */
    getUserMessage() {
      this.$get(`/uc/user/${this.loginData.userId}`)
      .then(res => {
        let { code, data } = res;
        if(code === 200) {
          this.userInformation = data;
          // this.loginData = common.getLoginMsg();
        }
      })
      .catch(error => {

      })
    }
  },
  mounted() {
    console.log("loginPage加载完成");
    if(this.isLogin){
      this.getUserMessage();
    }
  }
};
</script>

<style>
.loginForm {
  margin: 0 auto;
  margin-top: 50px;
  width: 70%;
  position: relative;
}
.loginForm p {
  margin: 30px 0 5px;
  color: #f2f2f2;
  /* text-align: center; */
}
.login-btn{
  width: 70%;
}

.userInfo {
  margin-left: 20px;
}
.userInfo .textItem {
  font-size: 16px;
  line-height: 60px;
}
.userInfo .textItem label {
    padding-right: 15px;
    width: 100px;
    text-align: right;
    display: inline-block;
}
.logout {
  padding-top: 20px;
  text-align: center;
}
</style>