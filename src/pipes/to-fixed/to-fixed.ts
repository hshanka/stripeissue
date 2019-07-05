import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'toFixed',
})
export class ToFixedPipe implements PipeTransform {
  
  transform(value: any, ...args) {
    return Number(value).toFixed(2); 
  }
  
}
