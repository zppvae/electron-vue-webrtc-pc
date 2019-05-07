import { Message } from 'element-ui';

/** 
 * 全局自定义 element-ui的message消息提示框样式
 */
export let Hint = (message, type) => {
  Message({
    message,
    type,
    center: true,
    customClass: 'messagebox'
  })
}