import { convertFileSrc } from '@tauri-apps/api/core'
import { resolveResource } from '@tauri-apps/api/path'
import { readDir } from '@tauri-apps/plugin-fs'

import { preparePcm16Asset } from '@/utils/audio-normalization'
import { join } from '@/utils/path'

interface AudioSample {
  id: string
  name: string
  path: string
  url: string
  refCount: number
}

interface AudioFile {
  name: string
  path: string
}

interface LoadedAsset {
  id: string
  bytes: number
}

type AudioContextClass = typeof AudioContext

const AUDIO_DIR = 'assets/audio'
const AUDIO_REGEX = /\.(?:wav|mp3)$/i
const MEOW_REGEX = /meow|cat/i
const SAMPLES_PER_KEY = 4
const MASTER_VOLUME = 1

class KeyAudioEngine {
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private workletPromise?: Promise<AudioWorkletNode | null>
  private samplesPromise?: Promise<AudioSample[]>
  private samples: AudioSample[] = []
  private loadedAssets = new Map<string, LoadedAsset>()
  private loadingAssets = new Map<string, Promise<void>>()
  private keySamples = new Map<string, AudioSample[]>()
  private sampleVolumes = new Map<string, number>()
  private meowSamples: AudioSample[] = []
  private lastByKey = new Map<string, number>()
  private keySignature = ''
  private shuffledSamples: AudioSample[] = []
  private assignIndex = 0
  private ready = false
  private soundFxEnabled = true

  async setKeys(keys: string[]) {
    const nextKeys = [...new Set(keys)].sort()
    const signature = nextKeys.join('\0')

    if (signature !== this.keySignature) {
      this.keySignature = signature
      this.keySamples.clear()
      this.sampleVolumes.clear()
      this.lastByKey.clear()

      await this.loadSamples()

      this.assignKeys(nextKeys)
      this.updateRefCounts()

      const node = await this.getWorkletNode()

      if (node) {
        await this.loadAssignedSamples(node)
      }

      this.ready = true
      console.warn(`[AudioEngine] Set keys: [${nextKeys.join(', ')}]`)
    }
  }

  setSoundFxEnabled(enabled: boolean) {
    this.soundFxEnabled = enabled
  }

  playKey(key: string) {
    if (!this.ready) {
      console.warn('[AudioEngine] Audio engine not ready, ignoring key:', key)
      return
    }

    const samples = this.keySamples.get(key)
    const sample = samples ? this.pickSample(key, samples) : void 0

    if (!sample) {
      console.warn(`[AudioEngine] No samples available for key: ${key}`)
      return
    }

    this.play(sample, key)
  }

  playMeow() {
    if (!this.ready || !this.soundFxEnabled) return

    const sample = this.pickSample('__meow', this.meowSamples)

    if (!sample) return

    this.play(sample)
  }

  private getAudioContext() {
    if (this.audioContext) return this.audioContext

    try {
      const ContextClass = window.AudioContext
        ?? (window as Window & typeof globalThis & { webkitAudioContext?: AudioContextClass }).webkitAudioContext

      if (!ContextClass) {
        console.error('[AudioEngine] AudioContext not supported')
        return null
      }

      try {
        this.audioContext = new ContextClass({ latencyHint: 'interactive' })
      } catch {
        this.audioContext = new ContextClass()
      }

      console.warn('[AudioEngine] AudioContext created, state:', this.audioContext.state)
      return this.audioContext
    } catch (error) {
      console.error('[AudioEngine] Failed to create AudioContext:', error)
      return null
    }
  }

  private getWorkletNode() {
    this.workletPromise ??= this.createWorkletNode()

    return this.workletPromise
  }

  private async createWorkletNode() {
    const context = this.getAudioContext()

    if (!context?.audioWorklet) return null

    try {
      await context.audioWorklet.addModule('/audio-worklet.js')

      this.workletNode = new AudioWorkletNode(context, 'bongo-cat-audio', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      })

      this.workletNode.connect(context.destination)
      this.workletNode.port.postMessage({ type: 'masterVolume', value: MASTER_VOLUME })

      return this.workletNode
    } catch (error) {
      console.error('[AudioEngine] Failed to create worklet node:', error)
      return null
    }
  }

  private loadSamples() {
    this.samplesPromise ??= this.findSamples()

    return this.samplesPromise
  }

  private async findSamples() {
    try {
      const root = await resolveResource(AUDIO_DIR)
      const files = await this.readAudioPaths(root)

      this.samples = files.sort((a, b) => a.path.localeCompare(b.path)).map(file => ({
        id: file.path,
        name: file.name,
        path: file.path,
        url: convertFileSrc(file.path),
        refCount: 0,
      }))
      this.meowSamples = this.samples.filter(sample => MEOW_REGEX.test(sample.name))
      this.shuffledSamples = this.shuffle(
        this.samples.filter(sample => !MEOW_REGEX.test(sample.name)),
      )
      this.assignIndex = 0

      console.warn(`[AudioEngine] Found ${this.samples.length} audio samples`)
      return this.samples
    } catch (error) {
      console.error('[AudioEngine] Error finding audio samples:', error)
      this.samples = []

      return []
    }
  }

  private async readAudioPaths(dir: string): Promise<AudioFile[]> {
    const entries = await readDir(dir).catch(() => [])
    const paths = await Promise.all(entries.map(async (entry) => {
      const path = join(dir, entry.name)

      if (entry.isDirectory) return this.readAudioPaths(path)
      if (AUDIO_REGEX.test(entry.name)) return [{ name: entry.name, path }]

      return []
    }))

    return paths.flat()
  }

  private async loadAssignedSamples(node: AudioWorkletNode) {
    const needed = new Set<AudioSample>()

    for (const keySamples of this.keySamples.values()) {
      for (const s of keySamples) {
        if (!this.loadedAssets.has(s.id)) needed.add(s)
      }
    }

    for (const s of this.meowSamples) {
      if (!this.loadedAssets.has(s.id)) needed.add(s)
    }

    if (!needed.size) return

    await Promise.all([...needed].map(s => this.loadAsset(s, node)))
  }

  private loadAsset(sample: AudioSample, node: AudioWorkletNode) {
    if (this.loadedAssets.has(sample.id)) return Promise.resolve()

    const existing = this.loadingAssets.get(sample.id)

    if (existing) return existing

    const promise = this.decodeAsset(sample, node).finally(() => {
      this.loadingAssets.delete(sample.id)
    })

    this.loadingAssets.set(sample.id, promise)

    return promise
  }

  private async decodeAsset(sample: AudioSample, node: AudioWorkletNode) {
    const context = this.getAudioContext()

    if (!context) return

    try {
      const response = await fetch(sample.url)

      if (!response.ok) {
        console.warn(`[AudioEngine] Failed to fetch audio: ${sample.url} - ${response.status}`)
        return
      }

      const decoded = await context.decodeAudioData(await response.arrayBuffer())

      const channelCount = Math.min(decoded.numberOfChannels, 2)
      const channels: Float32Array[] = []

      for (let i = 0; i < channelCount; i++) {
        channels.push(decoded.getChannelData(i))
      }

      const prepared = preparePcm16Asset(channels, decoded.sampleRate)
      const transfer = prepared.channels.map(channel => channel.buffer as ArrayBuffer)

      this.loadedAssets.set(sample.id, { id: sample.id, bytes: prepared.bytes })
      node.port.postMessage({
        type: 'load',
        id: sample.id,
        channels: transfer,
        length: prepared.length,
        normalizationGain: prepared.stats.normalizationGain,
        sampleRate: prepared.sampleRate,
      }, transfer)
    } catch (error) {
      console.error(`[AudioEngine] Error decoding audio asset ${sample.id}:`, error)
    }
  }

  private assignKeys(keys: string[]) {
    if (!keys.length || !this.shuffledSamples.length) return

    for (const key of keys) {
      const keySet: AudioSample[] = []
      const used = new Set<string>()
      const target = Math.min(SAMPLES_PER_KEY, this.shuffledSamples.length)

      while (keySet.length < target) {
        if (this.assignIndex >= this.shuffledSamples.length) {
          this.assignIndex = 0
        }

        const sample = this.shuffledSamples[this.assignIndex++]

        if (used.has(sample.id)) continue

        used.add(sample.id)
        keySet.push(sample)
      }

      this.keySamples.set(key, keySet)

      for (const sample of keySet) {
        this.sampleVolumes.set(`${key}\0${sample.id}`, Math.fround(0.1 + Math.random() * 0.8))
      }
    }
  }

  private updateRefCounts() {
    for (const sample of this.samples) {
      sample.refCount = MEOW_REGEX.test(sample.name) ? 1 : 0
    }

    for (const samples of this.keySamples.values()) {
      for (const sample of samples) {
        sample.refCount++
      }
    }
  }

  private pickSample(key: string, samples: AudioSample[]) {
    if (!samples.length) return

    let index = 0
    const last = this.lastByKey.get(key)

    if (samples.length > 1) {
      if (last === undefined) {
        index = Math.floor(Math.random() * samples.length)
      } else {
        index = Math.floor(Math.random() * (samples.length - 1))

        if (index >= last) index++
      }
    }

    this.lastByKey.set(key, index)

    return samples[index]
  }

  private play(sample: AudioSample, key?: string) {
    if (!this.soundFxEnabled) return

    const context = this.getAudioContext()
    const node = this.workletNode

    const volume = key !== undefined
      ? (this.sampleVolumes.get(`${key}\0${sample.id}`) ?? Math.fround(0.1 + Math.random() * 0.8))
      : Math.fround(0.1 + Math.random() * 0.8)

    if (!context || !node || !this.loadedAssets.has(sample.id)) {
      if (!context) console.warn('[AudioEngine] No audio context')
      if (!node) console.warn('[AudioEngine] No worklet node')
      if (!this.loadedAssets.has(sample.id)) console.warn('[AudioEngine] Sample not loaded:', sample.id)
      return
    }

    if (context.state === 'suspended') void context.resume()

    node.port.postMessage({ type: 'play', id: sample.id, volume })
  }

  private shuffle<T>(items: T[]) {
    const shuffled = [...items]

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }
}

export const audioEngine = new KeyAudioEngine()
