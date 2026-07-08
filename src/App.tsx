import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

type DownloadFormat = 'mp4' | 'mp3'
type DownloadStatus = 'idle' | 'downloading' | 'converting' | 'success' | 'error'

interface DownloadRequest {
  url: string
  format: DownloadFormat
}

interface FormatOption {
  value: DownloadFormat
  label: string
  detail: string
}

interface StatusCopy {
  label: string
  tone: 'muted' | 'active' | 'success' | 'error'
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'mp4', label: 'Video', detail: 'MP4' },
  { value: 'mp3', label: 'Audio', detail: 'MP3' },
]

const STATUS_COPY: Record<DownloadStatus, StatusCopy> = {
  idle: { label: 'Paste a YouTube link to begin.', tone: 'muted' },
  downloading: { label: 'Fetching video...', tone: 'active' },
  converting: { label: 'Converting...', tone: 'active' },
  success: { label: 'Done - check your downloads.', tone: 'success' },
  error: { label: 'Something went wrong.', tone: 'error' },
}

const DOWNLOAD_TIMEOUT_MS = 120_000

function isYouTubeUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value.trim())
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase()
    return host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be'
  } catch {
    return false
  }
}

function getFileNameFromDisposition(disposition: string | null, format: DownloadFormat): string {
  if (!disposition) {
    return `youtube-download.${format}`
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].replaceAll('"', '').trim())
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1]?.trim() || `youtube-download.${format}`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The download took too long. Try a shorter video or try again.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to reach the downloader. Make sure the backend is running.'
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = blobUrl
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000)
}

function App() {
  const [url, setUrl] = useState<string>('')
  const [format, setFormat] = useState<DownloadFormat>('mp4')
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const isValidUrl = useMemo<boolean>(() => isYouTubeUrl(url), [url])
  const isWorking = status === 'downloading' || status === 'converting'
  const currentStatus = status === 'error' && errorMessage
    ? { label: errorMessage, tone: 'error' as const }
    : STATUS_COPY[status]

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      return
    }

    if (!url.trim()) {
      setStatus('idle')
      setErrorMessage('')
    }
  }, [status, url])

  async function handleDownload(): Promise<void> {
    if (!isValidUrl || isWorking) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
    const payload: DownloadRequest = { url: url.trim(), format }

    setStatus('downloading')
    setErrorMessage('')

    const convertingTimer = window.setTimeout(() => {
      setStatus((current) => (current === 'downloading' ? 'converting' : current))
    }, 900)

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Download failed with status ${response.status}.`)
      }

      setStatus('converting')
      const blob = await response.blob()
      const fileName = getFileNameFromDisposition(
        response.headers.get('Content-Disposition'),
        format,
      )

      triggerBrowserDownload(blob, fileName)
      setStatus('success')
    } catch (error: unknown) {
      setStatus('error')
      setErrorMessage(getErrorMessage(error))
    } finally {
      window.clearTimeout(timeoutId)
      window.clearTimeout(convertingTimer)
    }
  }

  return (
    <main className="app-shell">
      <section className="download-card" aria-labelledby="app-title">
        <header className="masthead">
          <a className="wordmark" href="/" aria-label="YTD2D home">
            YTD2D
          </a>
          <span className="mini-badge">mono downloader</span>
        </header>

        <div className="disc-stage" aria-hidden="true">
          <div className="turntable">
            <div className={`record ${isWorking ? 'record--spinning' : ''}`}>
              <div className="record__ring record__ring--outer" />
              <div className="record__ring record__ring--middle" />
              <div className="record__label">
                {format.toUpperCase()}
              </div>
            </div>
            <div className="tonearm" />
            <div className="needle" />
          </div>
        </div>

        <div className="intro">
          <p className="eyebrow">YouTube downloader</p>
          <h1>Grab video or audio in one clean pass.</h1>
        </div>

        <label className="url-field">
          <span>YouTube URL</span>
          <input
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              if (status === 'success' || status === 'error') {
                setStatus('idle')
                setErrorMessage('')
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={url.trim().length > 0 && !isValidUrl}
            disabled={isWorking}
          />
        </label>

        <fieldset className="format-toggle">
          <legend>Format</legend>
          <div className="format-track">
            <span className={`format-thumb format-thumb--${format}`} />
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`format-pill ${format === option.value ? 'format-pill--active' : ''}`}
                onClick={() => setFormat(option.value)}
                disabled={isWorking}
              >
                <span>{option.label}</span>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <div className={`waveform ${isWorking ? 'waveform--active' : ''}`} aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => (
            <span key={index} style={{ '--bar-index': index } as CSSProperties} />
          ))}
        </div>

        <button
          type="button"
          className="download-button"
          onClick={() => void handleDownload()}
          disabled={!isValidUrl || isWorking}
        >
          {isWorking ? 'Working...' : 'Download'}
        </button>

        <p className={`status status--${currentStatus.tone}`} role="status" aria-live="polite">
          {currentStatus.label}
        </p>
      </section>
    </main>
  )
}

export default App
