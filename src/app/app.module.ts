import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {MatIconModule} from "@angular/material/icon";
import {RouterModule, Routes} from "@angular/router";
import {MenuComponent} from './menu/menu.component';
import {CompanionComponent} from './companion/companion.component';
import { TimeAgoPipe } from './time-ago.pipe';

export const routes: Routes = [
  {path: "", component: AppComponent},
  {path: "menu", component: MenuComponent},
  {path: "companion", component: CompanionComponent},
];

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    CompanionComponent,
    TimeAgoPipe
  ],
  imports: [
    BrowserModule,
    MatIconModule,
    RouterModule.forRoot(routes, {useHash: true}),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
