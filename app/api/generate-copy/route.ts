import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, creativeType, width, height, referenceImage } = await req.json()

    // Fetch starred brand references for style context
    const { data: starred } = await supabase
      .from('generations')
      .select('headline, subheading, cta, colors')
      .eq('starred', true)
      .limit(5)

    const brandContext = starred && starred.length > 0
      ? `\nBRAND STYLE REFERENCES (match this tone and energy):\n${starred.map((s: {headline:string,subheading:string,cta:string,colors:Record<string,string>}) =>
          `- Headline: "${s.headline}" | CTA: "${s.cta}" | Colors: ${JSON.stringify(s.colors)}`
        ).join('\n')}`
      : ''

    const systemPrompt = `You are a senior creative director at a top design agency. You generate punchy, on-brand marketing copy and precise color palettes. Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.`

    const userPrompt = referenceImage
      ? `Analyze this reference image carefully. Identify the layout composition, color mood, typography energy (bold/minimal/playful/corporate), and visual density. Then generate copy and colors that MATCH this reference style while communicating this brief: "${prompt}"
      
Creative type: ${creativeType} (${width}×${height}px)${brandContext}

Respond ONLY with this JSON:
{"headline":"max 6 words, punchy","subheading":"1 sentence max 15 words","cta":"2-4 words","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"imagePrompt":"detailed visual prompt for AI background matching the reference style and mood, NO text in image","styleMatched":true}`
      : `Generate copy for a ${creativeType} (${width}×${height}px).
Brief: "${prompt}"${brandContext}

Respond ONLY with this JSON:
{"headline":"max 6 words, punchy","subheading":"1 sentence max 15 words","cta":"2-4 words","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"imagePrompt":"detailed visual prompt for AI background, professional, NO text in image","styleMatched":false}`

    const messages: Anthropic.MessageParam[] = referenceImage
      ? [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: referenceImage } },
            { type: 'text', text: userPrompt }
          ]
        }]
      : [{ role: 'user', content: userPrompt }]

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    })

    const text = (message.content[0] as { type: string; text: string }).text
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
