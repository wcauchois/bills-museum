import * as THREE from "three"
import { audioOnAtom, store } from "../ui/state"

type SoundInfo = {
	url: string
}

const soundRegistry = {
	"retro-coin": {
		url: "/sound/retro-coin.mp3",
	},
	footstep: {
		url: "/sound/footstep.ogg",
	},
	jump1: {
		url: "/sound/jump-1.ogg",
	},
	jump2: {
		url: "/sound/jump-2.ogg",
	},
} satisfies Record<string, SoundInfo>

type SoundName = keyof typeof soundRegistry

export class AudioManager {
	private listener: THREE.AudioListener
	private audioLoader: THREE.AudioLoader

	private soundBuffers: Record<SoundName, Promise<AudioBuffer>>
	private audioSources: Record<SoundName, THREE.Audio>

	constructor(camera: THREE.Camera) {
		this.listener = new THREE.AudioListener()
		camera.add(this.listener)

		this.audioLoader = new THREE.AudioLoader()

		this.soundBuffers = {} as Record<SoundName, Promise<AudioBuffer>>
		this.audioSources = {} as Record<SoundName, THREE.Audio>
		for (const [soundName, soundInfo] of Object.entries(soundRegistry)) {
			this.soundBuffers[soundName as SoundName] = new Promise(resolve => {
				this.audioLoader.load(soundInfo.url, buffer => {
					resolve(buffer)
				})
			})
			this.audioSources[soundName as SoundName] = new THREE.Audio(this.listener)
		}
	}

	get isAudioOn() {
		return store.get(audioOnAtom)
	}

	playOnce(name: SoundName, options: { volume?: number } = {}) {
		if (!this.isAudioOn) {
			return
		}

		const audioSource = this.audioSources[name]
		const go = async () => {
			audioSource.stop()
			if (options.volume !== undefined) {
				audioSource.setVolume(options.volume)
			}
			audioSource.setBuffer(await this.soundBuffers[name])
			audioSource.play()
		}
		go()
	}
}
