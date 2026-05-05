'use client'
import { useState, useRef, useCallback } from 'react'
import { CREATIVE_TYPES, CreativeType } from '@/lib/constants'
import { Wand2, Loader2, Upload, X, Clock } from 'lucide-react'
import { GenerationResult } from '@/app/page'

interface Props {
  onGenerate: (result: GenerationResult) => void
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  onSelectHistory: (gen: GenerationResult) => void
}

interface HistoryItem {
  id: string
  creative_type: string
  prompt: string
  image_url: string
  headline: string
  subheading: string
  cta: string
  colors: Record<string, string>
  width: number
  height: number
  starred: boolean
}

export default function Sidebar({ onGenerate, isLoading, setIsLoading, onSelectHistory }: Props) {
  const [creativeType, setCreativeType] = useState<CreativeType>('Instagram Post')
  const [sizeIndex, setSizeIndex] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizes = CREATIVE_TYPES[creativeType]
  const selectedSize = sizes[sizeIndex]

  const loadHistory = async () => {
    if (historyLoaded) return
    const res = await fetch('/api/get-history')
    const { data } = await res.json()
    setHistory(data || [])
    setHistoryLoaded(true)
  }

  const handleImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setReferencePreview(dataUrl)
      // Extract base64 without the data:image/...;base64, prefix
      const base64 = dataUrl.split(',')[1]
      setReferenceImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageFile(file)
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)

    try {
      const copyRes = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          creativeType,
          width: selectedSize.w,
          height: selectedSize.h,
          referenceImage,
        }),
      })

      const copy = await copyRes.json()
      if (copy.error) throw new Error(copy.error)

      const imgW = Math.min(selectedSize.w, 1024)
      const imgH = Math.min(selectedSize.h, 1024)
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        copy.imagePrompt + ', professional design, no text, no words, no letters'
      )}?width=${imgW}&height=${imgH}&nologo=true&enhance=true&seed=${Date.now()}`
      // Route through our proxy so html2canvas can read pixels at export time
      const imageUrl = `/api/proxy-image?url=${encodeURIComponent(pollinationsUrl)}`

      const result: GenerationResult = {
        imageUrl,
        headline: copy.headline,
        subheading: copy.subheading,
        cta: copy.cta,
        colors: copy.colors,
        creativeType,
        width: selectedSize.w,
        height: selectedSize.h,
        prompt,
        styleMatched: copy.styleMatched,
        layout: copy.layout,
      }

      // Save to Supabase
      await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creative_type: creativeType,
          width: selectedSize.w,
          height: selectedSize.h,
          prompt,
          image_url: imageUrl,
          headline: copy.headline,
          subheading: copy.subheading,
          cta: copy.cta,
          colors: copy.colors,
        }),
      })

      onGenerate(result)
      setHistoryLoaded(false) // force refresh
    } catch (e: any) {
      console.error(e)
      alert(`Generation failed: ${e?.message || 'unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="w-80 border-r border-zinc-800 overflow-y-auto flex-shrink-0 flex flex-col">
      <div className="p-5 space-y-5 flex-1">

        {/* Creative Type */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Creative Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CREATIVE_TYPES) as CreativeType[]).map((type) => (
              <button
                key={type}
                onClick={() => { setCreativeType(type); setSizeIndex(0) }}
                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  creativeType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Size</label>
          <div className="space-y-1">
            {sizes.map((size, i) => (
              <button
                key={i}
                onClick={() => setSizeIndex(i)}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-xs transition-all ${
                  sizeIndex === i
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>{size.label}</span>
                <span className="opacity-60">{size.w}×{size.h}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Image */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Reference Image <span className="text-zinc-600 normal-case font-normal">(optional)</span>
          </label>
          {referencePreview ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={referencePreview} alt="Reference" className="w-full h-28 object-cover" />
              <button
                onClick={() => { setReferenceImage(null); setReferencePreview(null) }}
                className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black rounded-full p-1 transition-all"
              >
                <X size={12} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-violet-600/80 text-white text-[10px] text-center py-1">
                AI will match this layout style
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-zinc-700 hover:border-violet-600 hover:bg-violet-500/5'
              }`}
            >
              <Upload size={18} className="text-zinc-600 mx-auto mb-1.5" />
              <p className="text-zinc-500 text-[11px]">Drop image or click to upload</p>
              <p className="text-zinc-700 text-[10px] mt-0.5">AI matches layout & style</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageFile(file)
                }}
              />
            </div>
          )}
        </div>

        {/* Creative Brief */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Creative Brief</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Summer sale for a streetwear brand, bold and energetic, targeting 18-25 year olds"
            className="w-full bg-zinc-800/80 text-zinc-100 rounded-lg px-3 py-2.5 text-xs placeholder-zinc-600 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-violet-900/30"
        >
          {isLoading
            ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
            : <><Wand2 size={15} /> Generate Creative</>
          }
        </button>

        {/* Recent History */}
        <div>
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors mb-2 w-full"
          >
            <Clock size={11} /> Recent Generations
          </button>
          {history.length > 0 && (
            <div className="space-y-1.5">
              {history.slice(0, 8).map((gen) => (
                <button
                  key={gen.id}
                  onClick={() => onSelectHistory({
                    imageUrl: gen.image_url,
                    headline: gen.headline,
                    subheading: gen.subheading,
                    cta: gen.cta,
                    colors: gen.colors || {},
                    creativeType: gen.creative_type,
                    width: gen.width,
                    height: gen.height,
                    prompt: gen.prompt,
                  })}
                  className="w-full flex items-center gap-2.5 bg-zinc-800/60 hover:bg-zinc-700/60 rounded-lg p-2 transition-all text-left"
                >
                  <img src={gen.image_url} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0 bg-zinc-700" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-300 font-medium truncate">{gen.headline}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{gen.creative_type}</p>
                  </div>
                  {gen.starred && <span className="text-yellow-400 text-[10px] flex-shrink-0">★</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
