import { app ,ipcMain, Menu} from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import * as BMP from 'bmp-js'
import * as fs from "fs";
import * as PATH from "path";

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}
let mainWindow;
(async () => {
  await app.whenReady();

  mainWindow = createWindow('main', {
    width: 750,
    height: 750,
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on("convert:BMGtoC", async (event, path, valueByteOrder) => {
  const data = await bmpRead(path, valueByteOrder)
  mainWindow.webContents.send('BMGtoC:success', data);
})


const bmpRead = async (path, valueByteOrder) => {
  return new Promise( async (resolve, reject) => {
    const bmpBuffer = fs.readFileSync(path);
    const raw = bmpBuffer.toString('hex')
    const length = raw.length
    let s = []
    for (let i=0;i<length;i++){
      if (i % 2 === 0) {
        if(i != 0)
          s.push(raw.substring(i-2,i))
      }
    }
    const indexStartData = parseInt(s[13]+s[12]+s[11]+s[10],16)
    const w = parseInt(s[21]+s[20]+s[19]+s[18],16)
    const h =  parseInt(s[25]+s[24]+s[23]+s[22],16)
    console.log(indexStartData)
    const data = convert(indexStartData, s, valueByteOrder)
    const dataFlip = flip(data,w)
    const dataNewLine = newLine(dataFlip,16)
    resolve(dataNewLine);
  });
}



const convert = (indexStartData, list, valueByteOrder) => {
  let uList = []
  const length = list.length;
  let count = -2
  for (let i=length-1; i>= indexStartData; i--){
    if (i % 3 === 0) {
      if(i != 0 && i != length-1){
        let rRed = list[i - 1];
        let rGreen = list[i - 2];
        let rBlue = list[i];
        count++
        const color = {
          red:rRed, green:rGreen, blue:rBlue
        };
        let sColor = rgb24to16(color, valueByteOrder);
        uList.push(sColor);
      }
    }
  }
  return uList
}

const rgb24to16 = (color, valueByteOrder)=>{
  const red = parseInt(color.red,16);
  const green = parseInt(color.green,16);
  const blue = parseInt(color.blue,16);

  let rgb16 = ((red & 0xF8) << 8) | ((green & 0xFC) << 3) | (blue >> 3)

  let sRgb16 = rgb16.toString(16);
  sRgb16 = sRgb16.padStart(4,'0');

  if (valueByteOrder == "big") sRgb16 = sRgb16.substring(2,4) + sRgb16.substring(0,2);

  return '0x'+sRgb16;
}

const flip = (list,width)=>{
  let uList = []
  let aa = []
  let count =  0
  for(let n=0;n<list.length;n++){
    if(count < width){
      aa.push(list[n])
      count++
      if(count == width){
        aa.reverse()
        uList = [...uList,...aa]
        aa = []
        count = 0;
      }
    }
  }
  return uList
}

const newLine = (list, number)=>{
  let count = -1
  const uList = []
  for (let i=0; i < list.length;i++){
    count++
    if(count == number){
      uList.push('\n'+list[i])
      count = 0
    }else{
      uList.push(list[i])
    }
  }
  return uList
}

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ?
            'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  }
];