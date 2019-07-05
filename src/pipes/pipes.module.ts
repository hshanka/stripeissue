import { NgModule } from '@angular/core';
import { ToFixedPipe } from './to-fixed/to-fixed';
import { MomentPipe } from './moment/moment';

@NgModule({
	declarations: [
		ToFixedPipe,
	    MomentPipe
    ],
	imports: [],
	exports: [
		ToFixedPipe,
	    MomentPipe
    ]
})
export class PipesModule {}
