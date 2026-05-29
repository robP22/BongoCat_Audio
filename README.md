![BongoCat Audio](https://socialify.git.ci/robP22/BongoCat_Audio/image?custom_description=&description=1&font=Source+Code+Pro&forks=1&issues=1&logo=https%3A%2F%2Fgithub.com%2Fayangweb%2FBongoCat%2Fblob%2Fmaster%2Fsrc-tauri%2Fassets%2Flogo-mac.png%3Fraw%3Dtrue&name=1&owner=1&pattern=Floating+Cogs&pulls=1&stargazers=1&theme=Auto)

<div align="center">
  <div>
    <a href="https://github.com/robP22/BongoCat_Audio/releases"><img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB0PSIxNzI2MzA1OTcxMDA2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE1NDgiIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cGF0aCBkPSJNNTI3LjI3NTU1MTYxIDk2Ljk3MTAzMDEzdjM3My45OTIxMDY2N2g0OTQuNTEzNjE5NzVWMTUuMDI2NzU3NTN6TTUyNy4yNzU1NTE2MSA5MjguMzIzNTA4MTVsNDk0LjUxMzYxOTc1IDgwLjUyMDI4MDQ5di00NTUuNjc3NDcxNjFoLTQ5NC41MTM2MTk3NXpNNC42NzA0NTEzNiA0NzAuODMzNjgyOTdINDIyLjY3Njg1OTI1VjExMC41NjM2ODE5N2wtNDE4LjAwNjQwNzg5IDY5LjI1Nzc5NzUzek00LjY3MDQ1MTM2IDg0Ni43Njc1OTcwM0w0MjIuNjc2ODU5MjUgOTE0Ljg2MDMxMDEzVjU1My4xNjYzMTcwM0g0LjY3MDQ1MTM2eiIgcC1pZD0iMTU0OSIgZmlsbD0iI2ZmZmZmZiI+PC9wYXRoPjwvc3ZnPg==" /></a>
    <a href="https://github.com/robP22/BongoCat_Audio/releases"><img alt="MacOS" src="https://img.shields.io/badge/-MacOS-black?style=flat-square&logo=apple&logoColor=white" /></a>
    <a href="https://github.com/robP22/BongoCat_Audio/releases"><img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" /></a>
  </div>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/robP22/BongoCat_Audio?style=flat-square" /></a>
    <a href="https://github.com/robP22/BongoCat_Audio/releases/latest"><img src="https://img.shields.io/github/package-json/v/robP22/BongoCat_Audio?style=flat-square"/></a>
    <a href="https://github.com/robP22/BongoCat_Audio/releases"><img src="https://img.shields.io/github/downloads/robP22/BongoCat_Audio/total?style=flat-square"/></a>
  </p>
</div>

| macOS                                                                                        | Windows                                                                                        | Linux(x11)                                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ![macOS](https://i0.hdslb.com/bfs/openplatform/dff276b96d49c5d6c431b74b531aab72191b3d87.png) | ![Windows](https://i0.hdslb.com/bfs/openplatform/a4149b753856ee7f401989da902cf3b5ad35b39e.png) | ![Linux](https://i0.hdslb.com/bfs/openplatform/3b49f961819d3ff63b2b80251c1cc13c27e986b0.png) |

## Background

A fork of [ayangweb/BongoCat](https://github.com/ayangweb/BongoCat) with an integrated audio engine that adds realistic percussion sounds to the original desktop pet experience. The cat now plays bongo and conga samples in response to keyboard input, turning your typing into a drum performance.

Built with [Tauri](https://github.com/tauri-apps/tauri) — cross-platform support for macOS, Windows, and Linux(x11).

## Audio Engine

- **266 high-quality samples** — Bongos (strokes, slaps, flicks, rimshots, heel/toe techniques) and Congas (tribal percussion)
- **AudioWorklet-based playback** — runs on a dedicated audio thread for glitch-free, low-latency performance
- **64-voice polyphony** — supports rapid multi-key drumming without clipping
- **Per-key randomization** — each key press picks from up to 4 randomly assigned samples with varying volume
- **Loudness normalization** — samples normalized to -18 dB RMS for consistent volume
- **Duplicate detection** — identical audio files share memory automatically

## Download

- [GitHub Releases](https://github.com/robP22/BongoCat_Audio/releases)

## Features

- Works on macOS, Windows, and Linux(x11)
- Real-time bongo/conga audio on keyboard input
- Synchronized cat model animations (hands, eyes, body)
- Supports keyboard, mouse, and gamepad input
- Import custom Live2D models
- Fully open source — no data collection
- Offline capable — no internet required

## Model Conversion

To convert models from Bongo-Cat-Mver to BongoCat format:

🔗 [Online Converter](https://bongocat.vteamer.cc)

## More Models

Browse and download community models, or share your own:

📦 [Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat)

## Contributing

Thanks for your interest! See the [contributing guide](.github/CONTRIBUTING.md).

## Star History

<a href="https://www.star-history.com/#robP22/BongoCat_Audio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=robP22/BongoCat_Audio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=robP22/BongoCat_Audio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=robP22/BongoCat_Audio&type=Date" />
 </picture>
</a>
