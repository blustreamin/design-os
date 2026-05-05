'use client'
import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import {
  Download, Sparkles, Type, Plus, Trash2, AlignLeft, AlignCenter, AlignRight,
  Loader2, RotateCcw,
} from 'lucide-react'
import { GenerationResult, TextLayer, Layout } from '@/app/page'

interface Props {
  result: GenerationResult | null
}

type LayerKey = string

interface EditableLayer extends TextLayer {
  id: LayerKey
  text: string
  label: string
}

const FONT_OPTIONS = [
  // System
  { value: 'sans-serif', label: 'System Sans' },
  { value: 'serif', label: 'System Serif' },
  { value: 'monospace', label: 'System Mono' },
  // Google Fonts (loaded via app/layout)
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
]

const WEIGHTS = ['400', '500', '600', '700', '800', '900']

// Reasonable defaults if Claude doesn't return layout
function defaultLayout(): Layout {
  return {
    headline: { x: 8, y: 8, w: 84, fontSize: 9, fontFamily: 'Inter', fontWeight: '800', color: '#ffffff', align: 'left', bgColor: 'transparent', bgPadding: 0 },
    subheading: { x: 8, y: 22, w: 70, fontSize: 4, fontFamily: 'Inter', fontWeight: '500', color: '#ffffff', align: 'left', bgColor: 'transparent', bgPadding: 0 },
    cta: { x: 8, y: 86, w: 28, fontSize: 4, fontFamily: 'Inter', fontWeight: '700', color: '#ffffff', align: 'center', bgColor: '#7B5EA7', bgPadding: 14 },
  }
}

export default function ResultPanel({ result }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [layers, setLayers] = useState<EditableLayer[]>([])
  const [selectedId, setSelectedId] = useState<LayerKey | null>(null)
  const [exporting, setExporting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Build initial layers when result arrives
  useEffect(() => {
    if (!result) return
    const layout = result.layout || defaultLayout()
    const initial: EditableLayer[] = [
      { id: 'headline', label: 'Headline', text: result.headline, ...layout.headline },
      { id: 'subheading', label: 'Subheading', text: result.subheading, ...layout.subheading },
      { id: 'cta', label: 'CTA', text: result.cta, ...layout.cta },
    ]
    setLayers(initial)
    setSelectedId(null)
    setImgLoaded(false)
  }, [result])

  const updateLayer = useCallback((id: LayerKey, patch: Partial<EditableLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const removeLayer = (id: LayerKey) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const addLayer = () => {
    const id = `text-${Date.now()}`
    const newLayer: EditableLayer = {
      id,
      label: 'Text',
      text: 'New text',
      x: 25, y: 45, w: 50,
      fontSize: 5,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#ffffff',
      align: 'center',
      bgColor: 'transparent',
      bgPadding: 0,
    }
    setLayers((prev) => [...prev, newLayer])
    setSelectedId(id)
  }

  const resetLayout = () => {
    if (!result) return
    const layout = result.layout || defaultLayout()
    setLayers([
      { id: 'headline', label: 'Headline', text: result.headline, ...layout.headline },
      { id: 'subheading', label: 'Subheading', text: result.subheading, ...layout.subheading },
      { id: 'cta', label: 'CTA', text: result.cta, ...layout.cta },
    ])
    setSelectedId(null)
  }

  const handleExport = async () => {
    if (!canvasRef.current || !result) return
    setExporting(true)
    setSelectedId(null) // hide selection chrome
    try {
      // Wait a frame so deselect renders before snapshot
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      const html2canvas = (await import('html2canvas')).default
      const canvasEl = canvasRef.current
      const scale = result.width / canvasEl.offsetWidth // export at full target res
      const out = await html2canvas(canvasEl, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale,
        logging: false,
      })
      const dataUrl = out.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `designos-${result.creativeType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e: any) {
      console.error(e)
      alert(`Export failed: ${e?.message || 'unknown error'}\n\nIf the image is from a remote host, CORS may be blocking export. Try regenerating.`)
    } finally {
      setExporting(false)
    }
  }

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

  const selected = layers.find((l) => l.id === selectedId) || null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
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
          <p className="text-xs text-zinc-500 mt-1">Click any text to edit. Drag to move. Drag corner to resize.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm px-3 py-2 rounded-lg transition-colors"
            title="Reset to AI layout"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={addLayer}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add text
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !imgLoaded}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Exporting…' : 'Download PNG'}
          </button>
        </div>
      </div>

      {/* Canvas + properties */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Canvas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="w-full max-h-[75vh] flex items-center justify-center">
            <CanvasStage
              ref={canvasRef}
              imageUrl={result.imageUrl}
              width={result.width}
              height={result.height}
              layers={layers}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              updateLayer={updateLayer}
              onImgLoad={() => setImgLoaded(true)}
            />
          </div>
        </div>

        {/* Properties panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
          {selected ? (
            <PropertiesPanel
              layer={selected}
              colors={result.colors}
              onChange={(patch) => updateLayer(selected.id, patch)}
              onRemove={() => removeLayer(selected.id)}
            />
          ) : (
            <div className="text-center py-8">
              <Type size={20} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">
                Select a text layer to edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Layers list */}
      <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1">Layers</div>
        <div className="flex flex-wrap gap-2">
          {layers.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                selectedId === l.id
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <Type size={12} />
              <span className="max-w-[140px] truncate">{l.text || l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color palette reference */}
      {result.colors && (
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1">
            Palette (click swatch in properties to apply)
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.colors).map(([name, hex]) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5"
              >
                <span className="w-4 h-4 rounded border border-zinc-700" style={{ backgroundColor: hex }} />
                <span className="text-xs text-zinc-300 capitalize">{name}</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">{hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ----- Canvas stage with draggable/resizable layers -----

interface CanvasStageProps {
  imageUrl: string
  width: number
  height: number
  layers: EditableLayer[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  updateLayer: (id: string, patch: Partial<EditableLayer>) => void
  onImgLoad: () => void
}

const CanvasStage = forwardRef<HTMLDivElement, CanvasStageProps>(function CanvasStage(
  { imageUrl, width, height, layers, selectedId, setSelectedId, updateLayer, onImgLoad },
  ref,
) {
  const aspectRatio = `${width} / ${height}`

  const stageRef = useRef<HTMLDivElement | null>(null)
  const setRefs = (el: HTMLDivElement | null) => {
    stageRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
  }

  const onMouseDownLayer = (e: React.MouseEvent, id: string, mode: 'move' | 'resize') => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(id)
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const layer = layers.find((l) => l.id === id)
    if (!layer) return

    const startX = e.clientX
    const startY = e.clientY
    const startLayer = { ...layer }

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      if (mode === 'move') {
        updateLayer(id, {
          x: Math.max(0, Math.min(100 - startLayer.w, startLayer.x + dx)),
          y: Math.max(0, Math.min(98, startLayer.y + dy)),
        })
      } else {
        const newW = Math.max(8, Math.min(100 - startLayer.x, startLayer.w + dx))
        const newFont = Math.max(1.5, Math.min(30, startLayer.fontSize * (newW / startLayer.w)))
        updateLayer(id, { w: newW, fontSize: newFont })
      }
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={setRefs}
      onClick={() => setSelectedId(null)}
      className="relative w-full bg-zinc-950 rounded-lg overflow-hidden select-none"
      style={{ aspectRatio, maxHeight: '75vh' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Background"
        crossOrigin="anonymous"
        onLoad={onImgLoad}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {layers.map((l) => (
        <LayerBox
          key={l.id}
          layer={l}
          isSelected={selectedId === l.id}
          stageRef={stageRef}
          onMouseDownMove={(e) => onMouseDownLayer(e, l.id, 'move')}
          onMouseDownResize={(e) => onMouseDownLayer(e, l.id, 'resize')}
          onTextChange={(text) => updateLayer(l.id, { text })}
        />
      ))}
    </div>
  )
})

// ----- Single text layer -----

interface LayerBoxProps {
  layer: EditableLayer
  isSelected: boolean
  stageRef: React.RefObject<HTMLDivElement>
  onMouseDownMove: (e: React.MouseEvent) => void
  onMouseDownResize: (e: React.MouseEvent) => void
  onTextChange: (text: string) => void
}

function LayerBox({
  layer, isSelected, stageRef,
  onMouseDownMove, onMouseDownResize, onTextChange,
}: LayerBoxProps) {
  // Convert layer.fontSize (% of shorter side) to actual px based on stage size
  const [stageH, setStageH] = useState(0)
  const [stageW, setStageW] = useState(0)

  useEffect(() => {
    if (!stageRef.current) return
    const update = () => {
      if (!stageRef.current) return
      setStageW(stageRef.current.offsetWidth)
      setStageH(stageRef.current.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [stageRef])

  const shorter = Math.min(stageW, stageH) || 100
  const fontPx = (layer.fontSize / 100) * shorter

  const hasBg = layer.bgColor && layer.bgColor !== 'transparent'

  return (
    <div
      onMouseDown={onMouseDownMove}
      onClick={(e) => e.stopPropagation()}
      className={`absolute cursor-move ${isSelected ? 'outline outline-2 outline-violet-500 outline-offset-2' : ''}`}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.w}%`,
      }}
    >
      <div
        contentEditable={isSelected}
        suppressContentEditableWarning
        onBlur={(e) => onTextChange(e.currentTarget.textContent || '')}
        onMouseDown={(e) => {
          if (isSelected) e.stopPropagation() // allow text selection while editing
        }}
        className="outline-none break-words"
        style={{
          fontSize: `${fontPx}px`,
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight as any,
          color: layer.color,
          textAlign: layer.align,
          lineHeight: 1.15,
          backgroundColor: hasBg ? layer.bgColor : 'transparent',
          padding: hasBg ? `${layer.bgPadding}px ${layer.bgPadding * 1.4}px` : 0,
          borderRadius: hasBg ? `${layer.bgPadding * 0.7}px` : 0,
          display: 'inline-block',
          width: hasBg ? 'auto' : '100%',
          // Subtle shadow when no bg, for legibility on busy backgrounds
          textShadow: hasBg ? 'none' : '0 2px 12px rgba(0,0,0,0.45)',
        }}
      >
        {layer.text}
      </div>

      {isSelected && (
        <div
          onMouseDown={onMouseDownResize}
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-violet-500 border-2 border-white rounded-sm cursor-se-resize"
          title="Drag to resize"
        />
      )}
    </div>
  )
}

// ----- Properties panel -----

interface PropsPanelProps {
  layer: EditableLayer
  colors?: Record<string, string>
  onChange: (patch: Partial<EditableLayer>) => void
  onRemove: () => void
}

function PropertiesPanel({ layer, colors, onChange, onRemove }: PropsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
          {layer.label}
        </div>
        <button
          onClick={onRemove}
          className="text-zinc-500 hover:text-red-400 transition-colors"
          title="Delete layer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Text</label>
        <textarea
          value={layer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-white resize-none focus:outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Font</label>
        <select
          value={layer.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Weight</label>
          <select
            value={layer.fontWeight}
            onChange={(e) => onChange({ fontWeight: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Size</label>
          <input
            type="number"
            min={1}
            max={30}
            step={0.5}
            value={layer.fontSize}
            onChange={(e) => onChange({ fontSize: parseFloat(e.target.value) || 1 })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Align</label>
        <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
          {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Icon]) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                layer.align === a ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Text color</label>
        <ColorPicker value={layer.color} onChange={(c) => onChange({ color: c })} palette={colors} />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Background (pill)</label>
        <ColorPicker
          value={layer.bgColor}
          onChange={(c) => onChange({ bgColor: c })}
          palette={colors}
          allowTransparent
        />
        {layer.bgColor !== 'transparent' && (
          <div className="mt-2">
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Padding</label>
            <input
              type="range"
              min={0}
              max={40}
              value={layer.bgPadding}
              onChange={(e) => onChange({ bgPadding: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ----- Color picker with palette swatches + hex input -----

function ColorPicker({
  value, onChange, palette, allowTransparent = false,
}: {
  value: string
  onChange: (v: string) => void
  palette?: Record<string, string>
  allowTransparent?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {allowTransparent && (
          <button
            onClick={() => onChange('transparent')}
            className={`w-7 h-7 rounded border-2 ${
              value === 'transparent' ? 'border-violet-500' : 'border-zinc-700'
            } bg-zinc-950 relative overflow-hidden`}
            title="Transparent"
          >
            <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-500">none</span>
          </button>
        )}
        {['#ffffff', '#000000'].map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded border-2 ${value.toLowerCase() === c ? 'border-violet-500' : 'border-zinc-700'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        {palette && Object.entries(palette).map(([name, hex]) => (
          <button
            key={name}
            onClick={() => onChange(hex)}
            className={`w-7 h-7 rounded border-2 ${value.toLowerCase() === hex.toLowerCase() ? 'border-violet-500' : 'border-zinc-700'}`}
            style={{ backgroundColor: hex }}
            title={name}
          />
        ))}
      </div>
      <div className="flex gap-1.5 items-center">
        <input
          type="color"
          value={value === 'transparent' ? '#000000' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
        />
      </div>
    </div>
  )
}
