import { Injectable } from '@angular/core';

@Injectable()
export class FirebaseSnapService {

  private returnMainArray: Array<any>;
  private keyword: string;

  constructor() {}

  getFilteredArrays(tmpArray, mainArray, keyword) {
    this.keyword = keyword;
    this.returnMainArray = mainArray;
    this.loopMainArray(tmpArray); 
    return this.returnMainArray;
  }

  private loopMainArray(tmpArray) {
    tmpArray.forEach(element => {
      if (this._ckArrValueDuplication(element)) {
        this._updateArrValue(element);
      } else {
        this.returnMainArray.push(element);
      }
    });
  }

  private _ckArrValueDuplication(item) {
    let isExist = false;
    this.returnMainArray.forEach(el => {
      if (el[this.keyword] == item[this.keyword]) {
        isExist = true;
      }
    })
    return isExist;
  }

  private _updateArrValue(item) {
    let i = 0;
    this.returnMainArray.forEach(el => {
      if (el[this.keyword] == item[this.keyword]) {
        this.returnMainArray[i] = item;
      }
      i++;
    })
  }

}
