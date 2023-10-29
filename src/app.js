const {
  app,
  ipcMain,
  BrowserWindow,
  shell,
  Tray,
  screen
} = require("electron");
const path = require("path");
const fs = require("fs");
const log = require('electron-log');

/**************************************************
 * Screen size
 **************************************************/
let screenWidth = 0;
let screenHeight = 0;
const setScreenSizes = () => {
  screenWidth = screen.getPrimaryDisplay().bounds.width;
  screenHeight = screen.getPrimaryDisplay().bounds.height;
}

/**************************************************
 * Companion window
 **************************************************/
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

/**
 * @type Electron.CrossProcessExports.BrowserWindow
 */
let companionWindow;

async function createWindow() {
  setScreenSizes();

  // Create the browser window.
  companionWindow = new BrowserWindow({
    x: screenWidth - 120,
    y: screenHeight - 120,
    width: 80,
    height: 80,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
    },
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    companionWindow.loadURL('http://localhost:4200')
      .catch(console.error);
  } else {
    let uri = "./index.html";

    if (fs.existsSync(path.join(__dirname, "/dist/inatysco/index.html"))) {
      // Path when running electron in local folder
      uri = "/dist/inatysco/index.html";
    }
    companionWindow.loadURL("file://" + path.join(__dirname, uri) + "#/companion")
      .catch(e => console.error("Error loading Companion", e));
  }
  // companionWindow.openDevTools({mode: 'undocked'});

  companionWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
  companionWindow.setAlwaysOnTop(true, "floating");
  companionWindow.setFullScreenable(false);
  companionWindow.moveTop();
  companionWindow.on('closed', () => companionWindow = undefined);
  companionWindow.hide();
  return companionWindow;
}

ipcMain.handle(
  "openExternalUrl",
  (_, data) => shell.openExternal(data.url)
);
ipcMain.handle(
  "showCompanion",
  (_, value) => value ? companionWindow.show() : companionWindow.hide()
);
/**************************************************
 * Tray
 **************************************************/
let tray;
let trayMenuWindow;

function getTrayMenuXPosition(t, width) {
  let x;
  const trayWidth = t.getBounds().width;
  const trayX = t.getBounds().x;

  if (trayX === 0) {
    x = 0;
  } else if (trayX === screenWidth) {
    x = trayX - width;
  } else if (trayX < (width / 2)) {
    x = 0;
  } else if (trayX > screenWidth - (width / 2)) {
    x = trayX - width;
  } else {
    x = trayX - (width / 2) + (trayWidth / 2);
  }
  return x;
}

function getTrayMenuYPosition(t, height) {
  let y;
  const trayY = t.getBounds().y;
  const trayHeight = t.getBounds().height;

  if (trayY === 0) {
    y = 0;
  } else if (trayY === screenHeight) {
    y = trayY - height;
  } else if (trayY < (height / 2)) {
    y = 0;
  } else if (trayY > screenHeight - (height / 2)) {
    y = trayY - height;
  } else {
    y = trayY - (height / 2) + (trayHeight / 2);
  }
  return y;
}

function initTrayMenu() {
  const width = 500;
  const height = 465;
  const x = getTrayMenuXPosition(tray, width);
  const y = getTrayMenuYPosition(tray, height);

  trayMenuWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    resizable: false,
    frame: false,
    transparent: true,
    vibrancy: "menu",
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
   },
  });

  // Path when running electron executable
  let uri = "./index.html";

  if (fs.existsSync(path.join(__dirname, "/dist/ginny-companion/index.html"))) {
    // Path when running electron in local folder
    uri = "/dist/ginny-companion/index.html";
  }
  trayMenuWindow.loadURL("file://" + path.join(__dirname, uri) + "#/menu")
    .catch(e => console.error("Error loading Menu", e));
  trayMenuWindow.on("blur", () => trayMenuWindow.hide());
  trayMenuWindow.hide();
}

async function addTray() {
  tray = new Tray(__dirname + '/assets/grey-dot.png');
  tray.on(
    "click",
    () => trayMenuWindow.isVisible() ? trayMenuWindow.hide() : trayMenuWindow.show()
  );
  tray.setTitle("Loading...");
  // The delay is necessary to get the final position of the Tray.
  setTimeout(() => initTrayMenu(), 400);
}

ipcMain.handle(
  "openTrayContextMenu",
  () => trayMenuWindow.isVisible() ? trayMenuWindow.hide() : trayMenuWindow.show()
);

/**************************************************
 * Tray icon modifiers
 **************************************************/
ipcMain.handle("onNewRun", (_, data) => {
  tray.setTitle(data.ownerName);
  tray.setImage(__dirname + "/" + data.icon);
});

ipcMain.handle("closeApp", () => app.exit());

async function onAppReady() {
  await createWindow();
  await addTray();
  await app.dock.show();
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window.
  // More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(onAppReady, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', async () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (companionWindow === undefined) {
      await onAppReady();
    }
  });

} catch (e) {
  log.error(e);
}
