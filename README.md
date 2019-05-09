# webrtc 云视频会议应用程序

> a webrtc project
### 特别说明
 #### *****本例所有代码不得用于任何商业用途，仅作为参考使用。******

### 应用说明
适用于了解webrtc相关知识的用户
包含登录认证，turnserver，加入mcu会议，会中控制等

### 开发说明

> 目前仅针对Mac、Windows。

1. 你需要有node、git环境。需要了解npm的相关知识。
2. `git clone https://github.com/silenceLXD/electron-vue-webrtc-pc.git` 并进入项目
3. `npm install` 下载依赖
4. Mac需要有Xcode环境，Windows需要有VS环境。

### 开发模式

输入`npm run dev`进入开发模式，开发模式具有热重载特性。不过需要注意的是，开发模式不稳定，会有进程崩溃的情况。此时需要：

```bash
ctrl+c # 退出开发模式
npm run dev or yarn run dev # 重新进入开发模式
```

### 生产模式

如果你需要自行构建，可以`npm run build`开始进行构建。构建成功后，会在`build`目录里出现构建成功的相应安装文件。

**注意**：如果你的网络环境不太好，可能会出现`electron-builder`下载`electron`二进制文件失败的情况。这个时候需要在`npm run build`之前指定一下`electron`的源为国内源：

```bash
export ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"
npm run build
```

只需第一次构建的时候指定一下国内源即可。后续构建不需要特地指定。二进制文件下载在`~/.electron/`目录下。如果想要更新`electron`构建版本，可以删除`~/.electron/`目录，然后重新运行上一步，让`electron-builder`去下载最新的`electron`二进制文件。


---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
