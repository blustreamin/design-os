'use client'
import { useState } from 'react'
import { Download, Copy, Check, ImageIcon, Sparkles } from 'lucide-react'
import { GenerationResult } from '@/app/page'

interface Props {
  result: GenerationResult | null
}

export default function ResultPanel({ result }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No creative yet</h2>
          <p className="text-sm text-zinc-500">
            Configure your brief in the sidebar and hit generate to see your creative here.
          </p>
        </div>
      </div>
    )
  }

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(result.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `designos-${result.creativeType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  const colorEntries = Object.entries(result.colors || {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
              {result.creativeType}
            </span>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-[10px] text-zinc-500">
              {result.width} × {result.height}
            </span>
            {result.styleMatched && (
              <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/50">
                style matched
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">Your creative</h1>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={14} />
          Download
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        <div
          className="relative w-full bg-zinc-950 rounded-lg overflow-hidden"
          style={{ aspectRatio: `${result.width} / ${result.height}` }}
        >
          {result.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.imageUrl}
              alt={result.headline || 'Generated creative'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <ImageIcon size={32} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 mb-6">
        <CopyField
          label="Headline"
          value={result.headline}
          copied={copied === 'headline'}
          onCopy={() => handleCopy(result.headline, 'headline')}
        />
        <CopyField
          label="Subheading"
          value={result.subheading}
          copied={copied === 'subheading'}
          onCopy={() => handleCopy(result.subheading, 'subheading')}
        />
        <CopyField
          label="CTA"
          value={result.cta}
          copied={copied === 'cta'}
          onCopy={() => handleCopy(result.cta, 'cta')}
        />
      </div>

      {colorEntries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">
            Color palette
          </div>
          <div className="flex flex-wrap gap-3">
            {colorEntries.map(([name, hex]) => (
              <button
                key={name}
                onClick={() => handleCopy(hex, `color-${name}`)}
                className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1.5 transition-colors"
                title="Copy hex"
              >
                <span
                  className="w-5 h-5 rounded border border-zinc-700"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs text-zinc-300 capitalize">{name}</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">{hex}</span>
                {copied === `color-${name}` && (
                  <Check size={12} className="text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          Prompt used
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {result.prompt}
        </p>
      </div>
    </div>
  )
}

interface CopyFieldProps {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}

function CopyField({ label, value, copied, onCopy }: CopyFieldProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
          {label}
        </div>
        <p className="text-sm text-white break-words">
          {value || <span className="text-zinc-600 italic">empty</span>}
        </p>
      </div>
      <button
        onClick={onCopy}
        disabled={!value}
        className="flex-shrink-0 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        {copied ? (
          <>
            <Check size={12} className="text-emerald-400" />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy
          </>
        )}
      </button>
    </div>
  )
}
