  // video src赋值
  var setVideo = {
    getIdDom: function(idName) {
      return document.getElementById(idName);
    },
    init: function(idName,stream) {
      this.bindEvent_srcObject(idName,stream);
    },
    bindEvent_srcObject: function(idName, stream) {
      var dom = this.getIdDom(idName);
      dom.srcObject = stream;
    },
    bindEvent_Src: function (idName, stream) {
      var dom = this.getIdDom(idName);
      dom.src = stream;
    },
    bindEvent_value: function (idName, data) {
      console.log(data)
      var dom = this.getIdDom(idName);
      dom.value = data;
    },
    getCookie: function(name) {
      var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
      if(arr=document.cookie.match(reg))
      return decodeURI(arr[2]);
      else
      return null;
    },
    getCookieObj: function(name){
      var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
      if(arr=document.cookie.match(reg))
      return unescape(arr[2]);
      else
      return null;
    }
  }
  export default setVideo
