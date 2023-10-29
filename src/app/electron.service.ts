import {Inject, Injectable} from '@angular/core';
import {ipcRenderer} from 'electron';
import {DOCUMENT} from "@angular/common";
import {Run} from "./github.service";

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  private readonly ipcRenderer: typeof ipcRenderer | undefined;
  private showCompanion = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
      const window = <any>this.document.defaultView;
    if (window && window.require) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
    } else {
      console.error("Window or Window.require is undefined");
    }
  }

  async closeApp() {
    if (this.ipcRenderer) {
      await this.ipcRenderer.invoke('closeApp');
    } else {
      console.error("ipcRenderer is undefined");
    }
  }

  async openUrl(url: string) {
    if (this.ipcRenderer) {
      await this.ipcRenderer.invoke('openExternalUrl', {url});
    } else {
      console.error("ipcRenderer is undefined");
    }
  }

  async onNewRun(run: Run) {
    if (this.ipcRenderer) {
      this.showCompanion = !this.showCompanion;
      await this.ipcRenderer.invoke('onNewRun', run);
    } else {
      console.error("ipcRenderer is undefined");
    }
  }

  async toggleCompanion() {
    if (this.ipcRenderer) {
      this.showCompanion = !this.showCompanion;
      await this.ipcRenderer.invoke('showCompanion', this.showCompanion);
    } else {
      console.error("ipcRenderer is undefined");
    }
  }

  isCompanionVisible() {
    return this.showCompanion;
  }
}
