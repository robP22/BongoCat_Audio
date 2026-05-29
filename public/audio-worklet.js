const INV_32768 = 1 / 32768

function fastTanh(x) {
  return x * (27 + x * x) / (27 + 9 * x * x)
}

class BongoCatAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    this.assets = new Map()
    this.voices = Array.from({ length: 64 }, () => ({
      active: false,
      asset: null,
      position: 0,
      step: 1,
      gain: 1,
    }))
    this.masterVolume = 1

    this.port.onmessage = ({ data }) => {
      if (data.type === 'load') {
        const channels = data.channels.map(buffer => new Int16Array(buffer))

        this.assets.set(data.id, {
          channels,
          length: data.length,
          normalizationGain: Math.fround(data.normalizationGain),
          sampleRate: data.sampleRate,
        })
      } else if (data.type === 'play') {
        this.play(data.id, data.volume)
      } else if (data.type === 'masterVolume') {
        this.masterVolume = Math.fround(data.value)
      }
    }
  }

  play(id, volume) {
    const asset = this.assets.get(id)

    if (!asset) return

    for (let i = 0; i < this.voices.length; i++) {
      const voice = this.voices[i]

      if (voice.active) continue

      voice.active = true
      voice.asset = asset
      voice.position = 0
      voice.step = asset.sampleRate / sampleRate
      voice.gain = Math.fround(asset.normalizationGain * volume * this.masterVolume)

      return
    }
  }

  process(_, outputs) {
    const output = outputs[0]
    const left = output[0]
    const right = output[1]
    const frameCount = left.length
    let activeCount = 0

    for (let voiceIndex = 0; voiceIndex < this.voices.length; voiceIndex++) {
      const voice = this.voices[voiceIndex]

      if (!voice.active) continue

      activeCount++

      const asset = voice.asset
      const channelCount = asset.channels.length
      const leftPcm = asset.channels[0]
      const rightPcm = channelCount > 1 ? asset.channels[1] : leftPcm
      let position = voice.position

      for (let frame = 0; frame < frameCount; frame++) {
        const index = position | 0

        if (index >= asset.length) {
          voice.active = false
          voice.asset = null
          break
        }

        left[frame] += leftPcm[index] * INV_32768 * voice.gain

        if (right) {
          right[frame] += rightPcm[index] * INV_32768 * voice.gain
        }

        position += voice.step
      }

      voice.position = position
    }

    if (activeCount > 1) {
      const gain = 1 / Math.sqrt(activeCount)

      for (let frame = 0; frame < frameCount; frame++) {
        left[frame] = fastTanh(left[frame] * gain)
        if (right) right[frame] = fastTanh(right[frame] * gain)
      }
    } else if (activeCount === 0) {
      for (let frame = 0; frame < frameCount; frame++) {
        left[frame] = 0
        if (right) right[frame] = 0
      }
    }

    return true
  }
}

registerProcessor('bongo-cat-audio', BongoCatAudioProcessor)
