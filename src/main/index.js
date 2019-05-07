import { app, BrowserWindow, Menu } from 'electron' // 从electron引入app和BrowserWindow
import pkg from '../../package.json'
const path = require('path')
const url = require('url')
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080` // 开发模式的话走webpack-dev-server的url
  : `file://${__dirname}/index.html`

// 创建窗口
function createWindow () {
  /**
   * Initial window options
   */
  const options = {
    height: 600, // 高
    useContentSize: true,
    width: 1000, // 宽
    // backgroundColor: '#EDF4F5',
    // title: 'SVOC Webrtc', // 窗口的默认标题
    // show: false,
    // frame: true,
    center: true,
    webPreferences: {
      // backgroundThrottling: false
      webSecurity: false
    }
  }
  // 针对windows平台做出不同的配置
  if (process.platform === 'win32') {
    options.show = true; // 创建即展示
    // options.frame = false; // 创建一个framelessc窗口
    options.backgroundColor = '#3f3c37';
  }
  // 创建一个窗口
  mainWindow = new BrowserWindow(options)

  // 加载窗口的URL -> 来自renderer进程的页面
  // mainWindow.loadURL(winURL)
  mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
  }))

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 打开开发工具页面
  mainWindow.webContents.openDevTools({mode: "right"})

  global.sharedObject = {
      mainurl: winURL,
      nodeenv: process.env.NODE_ENV,
      name:"lixd"
  }

}
if (process.platform === 'win32') {
  app.setAppUserModelId(pkg.build.appId)
}
// app准备好的时候触发创建窗口
app.on('ready', ()=>{
  createWindow();
  createMenu();
})

// 所有窗口都关闭的时候触发
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { // 当操作系统不是darwin（macOS）的话
    app.quit() // 退出应用
  }
})

// （仅macOS）当应用处于激活状态时
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// 创建菜单
function createMenu() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://vip.svocloud.com') }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
    )

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
}

/** 菜单 **/
// const createMenu = () => {
//   if (process.env.NODE_ENV !== 'development') {
//     const template = [{
//       label: 'Edit',
//       submeny: [
//         { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
//         { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
//         { type: 'separator' },
//         { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
//         { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
//         { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
//         { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
//         {
//           label: 'Quit',
//           accelerator: 'CmdOrCtrl+Q',
//           click () {
//             app.quit()
//           }
//         }
//       ]
//     }]
//     const menu = Menu.buildFromTemplate(template);
//     Menu.setApplicationMenu(menu);
//   }
// }

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
