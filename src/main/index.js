import { app, BrowserWindow, Menu, dialog, Notification, ipcMain } from 'electron'
import pkg from '../../package.json'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  // 打开开发工具页面
  // mainWindow.webContents.openDevTools({mode: "right"})

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

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
        { role: 'selectall' },
        {
          label: '关于我们',
          click () {
            dialog.showMessageBox({
              title: 'SVOC',
              message: 'SVOC云视频',
              detail: `云起融通一直致力于运用领先的技术手段，为全球政企客户提供顶尖的全融合统一通讯云平台以及音视频增值业务解决方案。\nVersion: ${pkg.version}\nAuthor: ${pkg.author}\nCopyright © 2019 北京云起融通科技有限公司版权所有.`
            })
          }
        },
        {
          label: '了解更多',
          click () {
            require('electron').shell.openExternal('https://vip.svocloud.com')
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggledevtools', label: '开发者工具'},
        { role: 'togglefullscreen', label: '全屏' },
        {
            label: '退出',
            click () {
                app.quit()
            }
        },
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
    // template[3].submenu = [
    //   { role: 'close' },
    //   { role: 'minimize' },
    //   { role: 'zoom' },
    //   { type: 'separator' },
    //   { role: 'front' }
    // ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
}

// 退出登录
ipcMain.on('logout-dialog', function (event) {
    const options = {
        type: 'info',
        title: '退出',
        message: "您确定要退出吗？",
        buttons: ['确定', '取消']
    }
    dialog.showMessageBox(options, function (index) {
        event.sender.send('logout-dialog-selection', index)
    })
})

// 错误消息
ipcMain.on('open-error-dialog', function (event) {
    dialog.showErrorBox('错误', '这是一条错误消息');
})



app.on('ready', ()=>{
    createWindow();
    createMenu();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

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
