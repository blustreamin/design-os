'use client'
import { useEffect, useState } from 'react'
import { Star, Filter } from 'lucide-react'

interface Generation {
  id: string
  creative_type: string
  prompt: string
  image_url: string
  headline: string
  subheading: string
  cta: string
  colors: Record<string, string>
  starred: boolean
  created_at: string
}

const FILTERS = ['All', 'Starred', 'Instagram Post', 'Poster', 'Carousel', 'Brochure', 'Pitch Deck']

export default function BrandLibrary() {
  const [items, setItems] = useState<Generation[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/get-history')
      .then(r => r.json())
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  const toggleStar = async (id: string, current: boolean) => {
    await fetch('/api/toggle-star', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, starred: !current }),
    })
    setItems(prev => prev.map(item => item.id === id ? { ...item, starred: !current } : item))
  }

  const filtered = items.filter(item => {
    if (filter === 'All') return true
    if (filter === 'Starred') return item.starred
    return item.creative_type === filter
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={13} className="text-zinc-600" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            {f === 'Starred' ? '★ ' : ''}{f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-600 text-sm">No creatives yet — generate some first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all">
              <div className="relative aspect-square">
                <img
                  src={item.image_url}
                  alt={item.headline}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleStar(item.id, item.starred)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black rounded-full p-1.5 transition-all"
                >
                  <Star
                    size={13}
                    className={item.starred ? 'text-yellow-400 fill-yellow-400' : 'text-white/60'}
                  />
                </button>
                {item.starred && (
                  <div className="absolute top-2 left-2 bg-violet-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                    Brand Ref
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-zinc-200 truncate">{item.headline}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{item.cta}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{item.creative_type}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {item.colors && Object.values(item.colors).slice(0, 3).map((hex, i) => (
                      <div key={i} className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
