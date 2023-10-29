import {ChangeDetectorRef, NgZone, Pipe, PipeTransform} from '@angular/core';

// Sources: https://github.com/danrevah/ngx-pipes, https://github.com/AndrewPoyntz/time-ago-pipe
@Pipe({
  name: 'timeAgo',
  pure: false
})
export class TimeAgoPipe implements PipeTransform {
  private static YEAR_MS: number = 1000 * 60 * 60 * 24 * 7 * 4 * 12;
  private static MAPPER: any = [
    {single: 'last year', many: 'years', div: 1},
    {single: 'last month', many: 'months', div: 12},
    {single: 'last week', many: 'weeks', div: 4},
    {single: 'yesterday', many: 'days', div: 7},
    {single: 'an hour ago', many: 'hours', div: 24},
    {single: 'a minute ago', many: 'minutes', div: 60},
    {single: 'just now', many: 'seconds', div: 60},
  ];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
  }

  private timer: number | null = null;

  private setTimer(timeToUpdate: number) {
    timeToUpdate = this.getSecondsUntilUpdate(timeToUpdate);

    this.timer = this.ngZone.runOutsideAngular(() => {
      if (typeof window !== 'undefined') {
        return window.setTimeout(() => {
          this.ngZone.run(() => this.changeDetectorRef.markForCheck());
        }, timeToUpdate);
      }
      return null;
    });
  }

  private removeTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private getSecondsUntilUpdate(seconds: number) {
    let min = 60;
    let hr = min * 60;
    let day = hr * 24;
    if (seconds < min) {
      // less than 1 min, update every 2 secs
      return 2;
    } else if (seconds < hr) {
      // less than an hour, update every 30 secs
      return 30;
    } else if (seconds < day) {
      // less then a day, update every 5 mins
      return 300;
    } else {
      // update every hour
      return 3600;
    }
  }

  public transform(inputDate?: Date): string {
    this.removeTimer();
    if (!inputDate) {
      return '';
    }

    const past = inputDate.getTime();
    const now = new Date().getTime();

    if (past > now) {
      return 'in the future';
    }

    const ms = now - past;
    this.setTimer(ms);
    for (let i = 0, div = TimeAgoPipe.YEAR_MS; i < TimeAgoPipe.MAPPER.length; ++i) {
      const elm = TimeAgoPipe.MAPPER[i];
      const unit = Math.floor(ms / (div /= elm.div));
      if (unit >= 1) {
        return unit === 1 ? elm.single : `${unit} ${elm.many} ago`;
      }
    }

    return 'just now';
  }
}
