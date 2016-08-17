import { Component, ViewChild } from '@angular/core'

import * as Types from '../shared/types'
import * as Settings from '../shared/settings'

import { TrackComponent } from '../shared/track/track.component'
import { ScaleComponent } from '../shared/scale/scale.component'

@Component({
	selector: 'gt-home',
	template: `
		<div>
			<gt-track [setup]="setup" [mode]="mode"></gt-track>
		</div>
		<br>
		<gt-scale [domain]="mode.domain.position" (change)="onPositionChange($event)"></gt-scale>
`,
	styleUrls: ['./home.component.scss'],
	directives: [
		TrackComponent,
		ScaleComponent
	]
})
export class HomeComponent {
	@ViewChild(TrackComponent) track: TrackComponent

	setup: Types.MotionSetup
	mode: Types.ChallengeMode

	constructor() {
		this.mode = Settings.MODE_NORMAL
		this.setup = {
			position: 250,
			velocity: 0,
			posts: [10, 0, 10, 4, 10, 5]
		}
	}

	onPositionChange(newPosition: number) {
		this.setup.position = newPosition

		// TODO: track should what for changes in the setup object
		this.track.refresh()
	}
}
