import { Injectable } from '@angular/core'

import { Challenge } from '../types'

import * as Settings from '../settings'

@Injectable()
export class ApiService {
	key = 'such secret'

	private _challenges: Challenge[]
	private id: number = 0

	get challenges(): Challenge[] {
		if (this._challenges === undefined) {
			this._challenges = this.parseDefaultChallenges()
		}

		return this._challenges.slice()
	}

	getChallenge(id: string) {
		return this.challenges.find((c) => { return c.id === id })
	}

	private parseDefaultChallenges(): Challenge[] {
		let defaultChallenges: Challenge[] = []
		for (let trackSetup of Settings.DEFAULT_CHALLENGES) {
			let id = this.generateId()
			defaultChallenges.push({
				id: id,
				name: `Challenge #${id}`,
				custom: false,
				track: trackSetup
			})
		}

		return defaultChallenges
	}

	private generateId(): string {
		this.id++
		return this.id.toString()
	}
}
