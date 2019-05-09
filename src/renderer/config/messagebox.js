import { Message } from 'element-ui';

import { remote } from 'electron';
/**
 * 全局自定义 element-ui的message消息提示框样式
 */
let Notification = remote.Notification;
let ipc = remote.ipcRenderer;

export let Hint = (message, type) => {
  Message({
    message,
    type,
    center: true,
    customClass: 'messagebox'
  })
}
// 窗体消息提示
export let boxNotification = (title, body) =>{
    const notification = new Notification({
        title: title,
        body: body
    })
    notification.show()
}

// 窗体消息展示 错误消息
export let ErrorBox = (data) => {
  ipc.send('open-error-dialog', data);
}
