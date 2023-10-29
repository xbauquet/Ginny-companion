import {Component} from '@angular/core';
import {ElectronService} from "../electron.service";
import {GithubService} from "../github.service";

export type Run = { ownerName: string, icon: string, url: string, workflowName: string, createdAt: Date };

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  runs: Run[] = [];
  lastUpdate?: Date;

  constructor(private electronService: ElectronService,
              private githubService: GithubService) {
    this.githubService.runs.subscribe(runs => {
      this.runs = runs;
      this.electronService.onNewRun(runs[0]).catch(console.error);
    });
    this.githubService.lastUpdate.subscribe(v => this.lastUpdate = v);
  }

  isCompanionVisible() {
    return this.electronService.isCompanionVisible();
  }

  toggleCompanion() {
    this.electronService.toggleCompanion().catch(console.error);
  }

  openUrl(url: string) {
    this.electronService.openUrl(url).catch(console.error);
  }

  closeApp() {
    this.electronService.closeApp().catch(console.error);
  }
}
