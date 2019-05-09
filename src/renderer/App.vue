<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>

// import store from './store.js';
export default {
  name:'app',
  data() {
    return {
      key: 'value'
    }
  },
  methods: {
    fn() {

    }
  },
  mounted () {
    if(this.$store.state.loginData){
      // xmpp.init();
    }

  },
};
</script>
<style>
#app {
  color: #fff;
}
div.ivu-drawer-content {
  background-color: #3f4a5d;
  color: #fff;
}
div.ivu-drawer-header-inner {
  color: #fff;
}
div.ivu-drawer-header {
  border-bottom: 1px solid #535c65;
}
input[type="text"],
input[type="password"] {
  background-color: transparent;
  color: #fff;
  border: none;
  border-radius: 0;
  border-bottom: 1px solid #949898;
}
input[type="text"]:hover,
input[type="text"]:focus,
input[type="password"]:hover,
input[type="password"]:focus {
  border-bottom: 1px solid #949898;
}
a.ivu-drawer-close .ivu-icon-ios-close{
  top: 0px;
}
i.ivu-icon-ios-close:before{
  background-color: #fff;
  border-radius: 50%;
}

.tool-item{
  display: inline-block;
  /* width: 50px; */
  height: 50px;
  color: #fff;
  /* border: 1px solid #fff; */
  /* border-radius: 50%; */
  margin: 0px 16px;
}
.tool-item .tool-icon{
    display: block;
    font-size: 22px;
    padding: 5px;
  }
</style>
