const {
  app,
  Tray,
  Menu,
  //nativeImage,
  dialog,
  //clipboard,
  //globalShortcut,
} = require("electron");
//const { spawn } = require('child_process');//以管理员身份重启应用
const path = require("path"); //处理文件路径
const cron = require("node-cron");
const fs = require("fs");
//const { screen } = require("@nut-tree-fork/nut-js");
const si = require("systeminformation"); //内存使用
const { getActiveWindowInfo } = require("./get-active"); //获取当前活动窗口
const config = require("./config.json");
let isAutoStartEnabled = app.isPackaged ? true : false; //开机自启
if (app.isPackaged) {
  app.setLoginItemSettings({ openAtLogin: true });
}

cron.schedule("*/5 * * * *", send_data);
async function send_data() {
  let active = await getActiveWindowInfo();
  if (active.exe === "Tai.exe") {
    return;
  }
  const mem = await si.mem();
  const mem_str = `${(mem.used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(
    (mem.used / mem.total) *
    100
  ).toFixed(2)}%`;
  const now = new Date();
  const time_str = `${now.getMonth() + 1}/${now.getDate()} ${
    now.toTimeString().split(" ")[0]
  }`;
  try {
    fetch(config.server_url + "/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Key": config.key,
      },
      body: JSON.stringify({
        device: "laptop",
        app_title: active.title,
        app_exe: active.exe,
        mem: mem_str,
        time: time_str,
      }),
    });
  } catch (e) {
    console.error(e);
    dialog.showErrorBox("错误", e.message);
  }
}
let tray = null;
app.whenReady().then(() => {
  // 函数：更新托盘菜单
  const updateTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "开机自启",
        type: "checkbox",
        checked: isAutoStartEnabled,
        click: () => {
          isAutoStartEnabled = !isAutoStartEnabled;
          app.setLoginItemSettings({ openAtLogin: isAutoStartEnabled });
          updateTrayMenu(); // 刷新菜单以反映新状态
        },
      },
      { type: "separator" },
      // { label: '管理员身份重启', type: 'normal', click: () => { restart_as_admin() } },
      {
        label: "马上发送数据",
        type: "normal",
        click: () => {
          send_data();
        },
      },
      {
        label: "退出",
        type: "normal",
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  // 检查托盘图标是否存在
  const iconPath = path.join(__dirname, "icon.png");
  if (!fs.existsSync(iconPath)) {
    console.error("托盘图标未找到:", iconPath);
    dialog.showErrorBox("错误", "托盘图标文件缺失");
    return;
  }

  tray = new Tray(iconPath);
  updateTrayMenu();
});

// function restart_as_admin() {
//     const elevatePath = path.join(process.resourcesPath, 'elevate.exe');
//     const exePath = process.execPath;
//     console.log('elevate.exe 路径:', elevatePath);
//     console.log('目标 EXE 路径:', exePath);
//     const child = spawn(elevatePath, [exePath], {
//         detached: true,
//         stdio: 'ignore',
//     });
//     child.unref();
//     app.quit();
// };

// let tray = null;
// app.whenReady().then(() => {

//     var screenshot_mode = 1;
//     const ss_mode_change = (mode) => {
//         screenshot_mode = mode;
//         switch (mode) {
//             case 0:
//                 del_ssmode1();
//                 del_ssmode2();
//                 break;
//             case 1:
//                 reg_ssmode1();
//                 del_ssmode2();
//                 break;
//             case 2:
//                 del_ssmode1();
//                 reg_ssmode2();
//                 break;
//             default:
//                 break;
//         };
//     };
//     ss_mode_change(1);

//     tray = new Tray(path.join(__dirname, 'icon.png'));
//     const contextMenu = Menu.buildFromTemplate([
//         { label: '截图模式', type: 'submenu', submenu: [
//             { label: '关闭', type: 'radio', checked: screenshot_mode === 0, click: () => { ss_mode_change(0) } },
//             { label: '按键检测', type: 'radio', checked: screenshot_mode === 1, click: () => { ss_mode_change(1) } },
//             { label: '剪贴板识别', type: 'radio', checked: screenshot_mode === 2, click: () => { ss_mode_change(2) } },
//         ] },
//         { type: 'separator'},

//         { label: '管理员身份重启', type: 'normal', click: () => { restart_as_admin() } },
//         { label: '马上发送数据', type: 'normal', click: ()=>{setTimeout(send_data, 500);} },
//         { label: '退出', type: 'normal', click: () => { app.quit() } }
//     ]);
//     tray.setContextMenu(contextMenu);
// });

// if(fs.existsSync(config.ss_save_path) === false){
//     fs.mkdirSync(config.ss_save_path, { recursive: true });
// };

// function del_ssmode1(){
//     globalShortcut.unregister('PrintScreen');
// };
// function reg_ssmode1(){
//     globalShortcut.register('PrintScreen',async()=>{
//         await screen.capture(
//             fileName=`screenshot_${Date.now()}`,
//             fileFormat='.png',
//             filePath=config.ss_save_path
//         );
//         //console.log('Screenshot saved');
//     });
// };

// var ssm2_interval = null;
// var ssm2_last_hash = null;
// function del_ssmode2(){
//     if(ssm2_interval){
//         clearInterval(ssm2_interval);
//         ssm2_interval = null;
//     };
// };
// function reg_ssmode2(){
//     ssm2_interval = setInterval(()=>{
//         const image = clipboard.readImage();
//         let hash = image.toDataURL();
//         if( image.isEmpty() || hash === ssm2_last_hash ){return;};
//         ssm2_last_hash = hash;
//         fs.writeFile(
//             path.join(config.ss_save_path, `screenshot_${Date.now()}.png`),
//             image.toPNG(),
//             (err) => {
//                 if(err){
//                     console.error(err);
//                     dialog.showErrorBox('错误', err.message);
//                 }else{
//                     //console.log('Screenshot saved');
//                 };
//             }
//         );
//     },1000);
// };
