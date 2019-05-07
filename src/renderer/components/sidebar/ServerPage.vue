<template>
<!-- 设置服务器 -->
  <div class="serverPage">
    <div class="sidebar-left">
      <el-form :model="serverForm" :rules="rules" ref="serverForm">
        <el-form-item label="" prop="serverAddr">
          <el-input
          placeholder="请输入服务器地址"
          v-model="serverForm.serverAddr"
          clearable>
        </el-input>
        <span v-show="false">{{serverAddr}}</span>  
        </el-form-item>
        <el-form-item>
          <div class="save-server">
            <el-button type="primary" round @click="setServerAddr('serverForm')">保 存</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: "serverPage",
  data() {
    var validateUrl = (rule, value, callback) => {
      if(value === '') {
        callback(new Error('请输入服务器地址'));
      }else{
        var reg= /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
        if(!reg.test(value)) {
          callback(new Error('请输入正确的服务器地址'));
        }else{
          callback();
        }
      }
    };
    return {
      serverForm: {
        serverAddr: ''
      },
      rules: {
        serverAddr: [
          { validator: validateUrl, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    serverAddr() {
      const _serverAddr = this.$store.getters.getServerAddress;
      this.serverForm.serverAddr = _serverAddr
      return _serverAddr
    }
  },
  methods: {
    setServerAddr(formName) {
       this.$refs[formName].validate((valid) => {
        if(valid) {
          console.log('setServerAddr====>', this.serverForm.serverAddr)
          this.$store.commit("setServerAddress",this.serverForm.serverAddr);
          // 设置成功后返回到index
          this.$router.push("/index");
        }else{
          this.Hint('服务器地址设置失败', 'error');
        }
      })
    }
  }
};
</script>

<style>
  .serverPage{
    margin-top: 20px;
  }
  .sidebar-left{
    margin-left: 1rem;
  }
  .save-server{
    text-align: center;
    margin-top: 3rem;
  }
  .save-server button{
    width: 160px;
  }
</style>