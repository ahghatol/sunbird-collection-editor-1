import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, skipWhile, tap} from 'rxjs/operators';
import * as _ from 'lodash-es';
import { PublicDataService} from '../public-data/public-data.service';
import { DataService} from '../data/data.service';
@Injectable({
  providedIn: 'root'
})

export class HelperService {
  // tslint:disable-next-line:variable-name
  private _availableLicenses: Array<any>;
  // tslint:disable-next-line:variable-name
  private _channelData: any;
  // tslint:disable-next-line:variable-name
  private _channelData$ = new BehaviorSubject<any>(undefined);

  public readonly channelData$: Observable<any> = this._channelData$
  .asObservable().pipe(skipWhile(data => data === undefined || data === null));

  constructor(private publicDataService: PublicDataService, private dataService: DataService) { }

  initialize(channelId) {
    this.getLicenses().subscribe((data: any) => this._availableLicenses = _.get(data, 'license'));
    this.getChannelData(channelId).subscribe(data => {
      this._channelData = data;
      this._channelData$.next({ err: null, channelData: this._channelData });
    });
  }

  public get channelInfo(): any {
    return this._channelData;
  }

  public get contentPrimaryCategories() : any {
    return _.get(this.channelInfo, 'contentPrimaryCategories') || [] ;
  }

  getLicenses(): Observable<any> {
    const req = {
      url: `composite/v3/search`,
      data: {
        request: {
          filters: {
            objectType: 'license',
            status: ['Live']
          }
        }
      }
    };
    return this.publicDataService.post(req).pipe(map((res: any) => {
      return res.result;
    }), catchError(err => {
      const errInfo = { errorMsg: 'search failed' };
      return throwError(errInfo);
    }));
  }

  getAvailableLicenses() {
    return this._availableLicenses;
  }

  getChannelData(channelId): Observable<any> {
    const channelData = sessionStorage.getItem(channelId);
    if (!channelData) {
      const channelOptions = {
        url: 'channel/v1/read/' + channelId
      };
      return this.dataService.get(channelOptions).pipe(map((data: any) => data.result.channel));
    } else {
      return of(channelData);
    }
  }

  get channelData() {
    return {
      contentPrimaryCategories: ['Course Assessment', 'eTextbook', 'Explanation Content', 'Learning Resource', 'Practice Question Set']
    };
  }

  hmsToSeconds(str) {
    const p = str.split(':');
    let s = 0; let m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return _.toString(s);
}

  getTimerFormat(field) {
    const validationObj = _.find(_.get(field, 'validations'), {type: 'time'});
    if (!_.isEmpty(validationObj)) {
      return validationObj.value;
    } else {
      return 'HH:mm:ss';
    }
  }



}
