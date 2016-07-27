import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'

import { MD_GRID_LIST_DIRECTIVES } from '@angular2-material/grid-list/grid-list'
import { MD_CARD_DIRECTIVES } from '@angular2-material/card/card'

import { ApiService } from '../services'
import { Challenge } from '../types'

@Component({
	moduleId: module.id,
	selector: 'challenge',
	templateUrl: '../templates/challenge_viewer.html',
	directives: [
		MD_GRID_LIST_DIRECTIVES,
		MD_CARD_DIRECTIVES
	]
})
export class ChallengeViewerComponent implements OnInit {
	challenge: Challenge

	constructor(private route: ActivatedRoute, private api: ApiService) {
		let id = this.route.snapshot.params['id']
		this.challenge = this.api.getChallenge(id)
	}

	ngOnInit() {
	}
}
