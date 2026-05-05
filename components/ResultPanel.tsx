'use client'
import { useState } from 'react'
import { GenerationResult } from '@/app/page'
import { Download, Copy, Check, Layers } from 'lucide-react'

interface Props { result: GenerationResult | null }

export default function ResultPanel({ result }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadImage = async () => {
    if (!result) return
    try {
      const res = await fetch(result.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.creativeType.replace(/\s/g, '-')}-${Date.now()}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(result.imageUrl, '_blank')
    }
  }

  const copyFigmaSpec = () => {
    if (!result) return
    const spec = `DesignOS — Figma Spec
━━━━━━━━━━━━━━━━━━━━
Creative: ${result.creativeType}
Frame Size: ${result.width} × ${result.height}px

COPY
Headline: ${result.headline}
Subheading: ${result.subheading}
CTA: ${result.cta}

COLORS
Primary:    ${result.colors.primary}
Secondary:  ${result.colors.secondary}
Accent:     ${result.colors.accent}
Background: ${result.colors.background}
Text:       ${result.colors.text}

━━━━━━━━━━━━━━━━━━━━
In Figma: Press F → draw frame at ${result.width}×${result.height}px
Then drag in the downloaded image as fill.`
    copyText(spec, 'figma')
  }

  if (!result) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Your creative will appear here</p>
          <p className="text-zinc-700 text-xs mt-1">Fill in the brief and hit Generate</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 animate-fade-in">

      {/* Style matched badge */}
      {result.styleMatched && (
        <div className="inline-flex items-center gap-1.5 bg-violet-900/30 border border-violet-700/40 text-violet-400 text-xs px-3 py-1.5 rounded-full">
          <span>✦</span> Style matched from reference image
        </div>
      )}

      {/* Image Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-800 aspect-square max-h-96">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-zinc-600 text-xs">Generating image...</p>
            </div>
          </div>
        )}
        <img
          src={result.imageUrl}
          alt="Generated creative"
          className="w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s' }}
          onLoad={() => setImgLoaded(true)}
        />
        {imgLoaded && (
          <div className="absolute inset-0 flex flex-col justify-center px-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <h2
              className="text-white font-bold text-2xl drop-shadow-lg leading-tight"
              style={{ fontFamily: 'system-ui' }}
            >
              {result.headline}
            </h2>
            <p className="text-white/80 text-sm mt-2 drop-shadow max-w-sm">
              {result.subheading}
            </p>
            <div
              className="mt-4 self-start px-5 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
              style={{ backgroundColor: result.colors.accent }}
            >
              {result.cta}
            </div>
          </div>
        )}
      </div>

      {/* Copy fields */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {[
          { label: 'Headline', value: result.headline, key: 'h' },
          { label: 'Subheading', value: result.subheading, key: 's' },
          { label: 'CTA', value: result.cta, key: 'c' },
        ].map(({ label, value, key }, i) => (
          <div key={key} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? 'border-b border-zinc-800' : ''}`}>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm text-zinc-100">{value}</p>
            </div>
            <button
              onClick={() => copyText(value, key)}
              className="text-zinc-600 hover:text-violet-400 transition-colors p-1 ml-3 flex-shrink-0"
            >
              {copied === key ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>
        ))}
      </div>

      {/* Color Palette */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Color Palette</p>
        <div className="flex gap-2">
          {Object.entries(result.colors).map(([name, hex]) => (
            <div key={name} className="flex-1 text-center">
              <button
                className="w-full h-9 rounded-lg mb-1.5 hover:scale-105 transition-transform border border-white/5"
                style={{ backgroundColor: hex }}
                onClick={() => copyText(hex, name)}
                title={`Copy ${hex}`}
              />
              <p className="text-[9px] text-zinc-600 capitalize">{name}</p>
              <p className="text-[9px] text-zinc-500">{hex}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={downloadImage}
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm py-3 rounded-xl transition-all"
        >
          <Download size={14} /> Download Image
        </button>
        <button
          onClick={copyFigmaSpec}
          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm py-3 rounded-xl transition-all"
        >
          {copied === 'figma' ? <Check size={14} /> : <Copy size={14} />}
          {copied === 'figma' ? 'Copied!' : 'Copy Figma Spec'}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-700">
        Set Figma frame to {result.width} × {result.height}px before pasting
      </p>
    </div>
  )
}
