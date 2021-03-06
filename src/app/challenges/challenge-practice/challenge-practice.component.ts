import { Component, OnInit, ViewChild } from '@angular/core'

import * as lodash from 'lodash'

import { Challenge, MotionSetup, MotionData, UI_CONTROL } from '../../shared/types'
import { interpolate } from '../../shared/helpers'
import { ANIMATION_DURATION, INITIAL_SETUP } from '../../settings'
import { ChallengesService } from '../../shared/challenges.service'
import { Motion } from '../../shared/motion.model'
import { GraphsPanelComponent } from '../../shared/graphs-panel/graphs-panel.component'
import { TrackPanelComponent } from '../../shared/track-panel/track-panel.component'
import { AuthService } from '../../shared/auth.service'

const SETUP_STORAGE_KEY = 'latest-track-setup'

@Component({
	selector: 'gt-challenge',
	templateUrl: 'challenge-practice.component.html',
	styleUrls: [
		'../challenge/challenge.component.scss',
		'challenge-practice.component.scss'
	]
})
export class ChallengePracticeComponent implements OnInit {
	@ViewChild(TrackPanelComponent)
	trackPanel: TrackPanelComponent

	@ViewChild(GraphsPanelComponent)
	graphsPanel: GraphsPanelComponent

	challengeId: string
	challenge: Challenge

	collectionIndex: number
	collectionIds: string[]

	goalMotion: Motion
	
	isReady = false
	
	ballFallAt: any

	constructor(
		private challenges: ChallengesService,
		public  auth: AuthService
	) {
		this.challengeId = 'practice'
	}

	ngOnInit() {
		this.isReady = true
		this.graphsPanel.hideGoal = true
		this.loadChallengeById(this.challengeId)
		this.loadTrackSetup()
		
		if (window['fs']) {
			window['fs']()
		}
	}

	onRollBall(setup: MotionSetup) {
		this.performMotion(setup)
	}

	onAbort() {
		if (this.trackPanel) {
			this.trackPanel.rolling = false
		}
	}

	onGraphPanelChange(control: UI_CONTROL) {
		this.trackPanel.updateBallPostion()
		if (this.trackPanel.rolling) {
			this.endAnimation()
		}
	}

	onTrackPanelChange(control: UI_CONTROL) {
		this.storeSetup()
		
		// TODO: Add setting for optional preview
		// let newGoalMotion = Motion.fromSetup(this.trackPanel.setup)
		// this.graphsPanel.animateGoalUpdate(newGoalMotion.data)
	}

	loadChallengeById(challengeId: string) {
		if (this.isReady === false) {
			return
		}

		let challenge = this.challenges.getById(challengeId)
		if (challenge) {
			this.onAbort()
			this.loadChallenge(lodash.cloneDeep(challenge))
		} else {
			// TODO: navigate 404
		}
	}

	loadChallenge(challenge: Challenge) {
		this.challenge = challenge
		this.challengeId = challenge.id
		this.goalMotion = Motion.fromSetup(this.challenge.goal, this.challenge.mode)
	}

	performMotion(setup: MotionSetup) {
		let trialMotion = Motion.fromSetup(setup)
		this.graphsPanel.addTrialData(trialMotion.data, true)
		this.trackPanel.cancelBallReset()
		
		if (trialMotion.fellOffAt) {
			this.ballFallAt = trialMotion.fellOffAt
		}
		
		this.animate(trialMotion.data, ANIMATION_DURATION)
	}

	animate(motion: MotionData[], duration: number) {
		this.trackPanel.rolling = true
		let animationStartedAt = Date.now()
		duration *= 1000

		// Ratio between real time and simulation time
		let timeRatio = (this.challenge.mode.simulation.duration * 1000) / duration

		// Index of which data point the animation is currently on
		// the index will be increased accordly with the amount of time elapsed
		let idx = 0
		let firstPoint = motion[idx]

		// If the animation isn't starting from the beggining
		// Adjust the real time offset to reflect that
		if (idx !== 0) {
			let timeToSkip = firstPoint.t * 1000
			animationStartedAt -= (timeToSkip / timeRatio)
		}

		let animationFrame = () => {
			let now = Date.now()
			let elapsedTime = now - animationStartedAt
			
			let overtime = elapsedTime > duration
			let aborted = !overtime && this.trackPanel.rolling !== true
			if (aborted || overtime) {
				if (aborted) {
					this.endAnimation(false, true)
				} else {
					this.endAnimation()
				}
				return
			}

			let t = elapsedTime * timeRatio
			let currentTime, nextTime, lastFound = idx, found = false
			while (idx < (motion.length - 1)) {
				currentTime = Math.floor(motion[idx].t * 1000)
				nextTime = Math.floor(motion[idx + 1].t * 1000)
				if (currentTime <= t && t < nextTime) {
					// This index is surrounded by two data points that have our current animation time
					// som we can interpolate the current position value from them
					found = true
					break
				} else {
					idx++
				}
			}

			let position
			if (found) {
				let current = motion[idx]
				let next = motion[idx + 1]
				position = interpolate(t, currentTime, nextTime, current.s, next.s)

				// queue next animation frame
				requestAnimationFrame(animationFrame)
			} else {
				let lastPoint = motion[lastFound + 1]
				if (lastPoint) {
					position = lastPoint.s
				} else {
					// It's probably a motion with a single data point (ball fall off right after T=0)
					position = motion[0].s
				}

				this.endAnimation()
				
				if (this.ballFallAt) {
					this.trackPanel.animateFall(this.ballFallAt)
				}
			}

			if (typeof position !== 'number') {
				console.error('Last data point not found')
			}

			this.graphsPanel.setTrialLineClip(elapsedTime / duration)
			this.trackPanel.updateBallPostion(position)
		}

		animationFrame()
	}

	endAnimation(justPause = false, aborted = false) {
		this.trackPanel.onAnimationEnded(justPause)
		
		if (!aborted) {
			// Restore some values
			this.graphsPanel.setTrialLineClip(1)
		}
	}

	storeSetup() {
		localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(this.trackPanel.setup))
	}

	loadTrackSetup() {
		this.trackPanel.setup = lodash.cloneDeep(INITIAL_SETUP)
	}
	
	isMobile() {
		return document.body.classList.contains('mobile')
	}
	
	stopPropagation(e: TouchEvent) {
		e.stopPropagation()
	}
}
