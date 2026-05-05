'use client'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ResultPanel from '@/components/ResultPanel'
import BrandLibrary from '@/components/BrandLibrary'

export interface TextLayer {
  x: number
  y: number
  w: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  color: string
  align: 'left' | 'center' | 'right'
  bgColor: string
  bgPadding: number
}

export interface Layout {
  headline: TextLayer
  subheading: TextLayer
  cta: TextLayer
}

export interface GenerationResult {
  id?: string
  imageUrl: string
  headline: string
  subheading: string
  cta: string
  colors: Record<string, string>
  creativeType: string
  width: number
  height: number
  prompt: string
  styleMatched?: boolean
  layout?: Layout
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generator' | 'library'>('generator')
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">DesignOS</span>
          <span className="text-[10px] bg-violet-900/40 text-violet-400 px-2 py-0.5 rounded-full border border-violet-800/50">v1.0</span>
        </div>

        <div className="flex items-center gap-1 ml-4 bg-zinc-900 rounded-lg p-1">
          {(['generator', 'library'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'generator' ? '✦ Generator' : '◈ Brand Library'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'generator' ? (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            onGenerate={setResult}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSelectHistory={(gen) => setResult(gen)}
          />
          <div className="flex-1 overflow-y-auto">
            <ResultPanel result={result} />
          </div>
        </div>
      ) : (
        <BrandLibrary />
      )}
    </main>
  )
}
