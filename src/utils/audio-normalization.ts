export interface AudioNormalizationStats {
  peak: number
  peakDb: number
  rms: number
  rmsDb: number
  normalizationGain: number
}

export interface Pcm16Asset {
  channels: Int16Array[]
  length: number
  sampleRate: number
  stats: AudioNormalizationStats
  bytes: number
}

const SILENCE_THRESHOLD = 1e-6

function dbToLinear(db: number) {
  return 10 ** (db / 20)
}

function linearToDb(value: number) {
  return value > 0 ? 20 * Math.log10(value) : -Infinity
}

export function preparePcm16Asset(
  channels: ReadonlyArray<ArrayLike<number>>,
  sampleRate: number,
  targetRmsDb = -18,
  maxPeakDb = -1,
): Pcm16Asset {
  let peak = 0
  let sumSquares = 0
  let count = 0

  const pcmChannels = channels.map((channel) => {
    const pcm = new Int16Array(channel.length)

    count += channel.length

    for (let i = 0; i < channel.length; i++) {
      const sample = channel[i]
      const clamped = Math.max(-1, Math.min(1, sample))
      const encoded = Math.round(clamped < 0 ? clamped * 32768 : clamped * 32767)
      const abs = Math.abs(sample)

      if (abs > peak) peak = abs

      sumSquares += sample * sample
      pcm[i] = encoded
    }

    return pcm
  })

  const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0
  let normalizationGain = peak <= SILENCE_THRESHOLD || rms === 0 ? 1 : dbToLinear(targetRmsDb) / rms
  const maxPeakLinear = dbToLinear(maxPeakDb)

  if (peak > SILENCE_THRESHOLD && peak * normalizationGain > maxPeakLinear) {
    normalizationGain = maxPeakLinear / peak
  }

  const length = Math.max(0, ...pcmChannels.map(channel => channel.length))
  const bytes = pcmChannels.reduce((total, channel) => total + channel.byteLength, 0)
  const stats = {
    peak,
    peakDb: linearToDb(peak),
    rms,
    rmsDb: linearToDb(rms),
    normalizationGain: Math.fround(normalizationGain),
  }

  return {
    channels: pcmChannels,
    length,
    sampleRate,
    stats,
    bytes,
  }
}
