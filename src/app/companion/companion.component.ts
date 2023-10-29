import {Component} from '@angular/core';
import {ipcRenderer} from 'electron';

@Component({
    selector: 'app-companion',
    templateUrl: './companion.component.html',
    styleUrls: ['./companion.component.scss']
})
export class CompanionComponent {
    private readonly ipcRenderer: typeof ipcRenderer | undefined;

    constructor() {
        this.ipcRenderer = window.require('electron').ipcRenderer;
    }

    async openTrayContextMenu() {
        if (this.ipcRenderer) {
            await this.ipcRenderer.invoke('openTrayContextMenu');
        } else {
            console.error("ipcRenderer is undefined");
        }
    }
}
