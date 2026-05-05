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

    const systemPrompt = `You are a senior creative director at a top design agency. You generate punchy on-brand marketing copy, precise color palettes, AND smart text layouts that compose well over a generated background image.

LAYOUT RULES:
- All positions/sizes are PERCENTAGES of the canvas (0-100), so they scale to any size.
- "x" and "y" are the TOP-LEFT corner of the text box. "w" is box width as % of canvas width.
- "fontSize" is in vw-equivalent units relative to the SHORTER canvas dimension (e.g. 8 means the text height ≈ 8% of the shorter side).
- Choose layouts that respect the imagePrompt — if the image is busy in the center, place text on edges. If the image has a dark sky on top, headline can sit there in light text. Think like a designer.
- Use the colors palette you generated. Headline gets max contrast against the area it sits on. CTA gets the accent color or a solid pill background.
- Vary layouts. Don't always center-stack. Try corners, sides, asymmetric compositions.
- Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.`

    const layoutSchema = `"layout":{"headline":{"x":number,"y":number,"w":number,"fontSize":number,"fontFamily":"Inter|Playfair Display|Bebas Neue|Space Grotesk|Roboto|Montserrat|Oswald|sans-serif|serif","fontWeight":"400|500|600|700|800|900","color":"#hex","align":"left|center|right","bgColor":"#hex or transparent","bgPadding":number},"subheading":{...same fields...},"cta":{...same fields, typically with solid bgColor as a pill...}}`

    const userPrompt = referenceImage
      ? `Analyze this reference image carefully. Identify the layout composition, color mood, typography energy (bold/minimal/playful/corporate), and visual density. Then generate copy, colors, AND a layout that MATCHES this reference style while communicating this brief: "${prompt}"

Creative type: ${creativeType} (${width}×${height}px)${brandContext}

Respond ONLY with this JSON:
{"headline":"max 6 words, punchy","subheading":"1 sentence max 15 words","cta":"2-4 words","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"imagePrompt":"detailed visual prompt for AI background matching the reference style and mood, NO text in image",${layoutSchema},"styleMatched":true}`
      : `Generate copy, colors, and a layout for a ${creativeType} (${width}×${height}px).
Brief: "${prompt}"${brandContext}

Respond ONLY with this JSON:
{"headline":"max 6 words, punchy","subheading":"1 sentence max 15 words","cta":"2-4 words","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"imagePrompt":"detailed visual prompt for AI background, professional, NO text in image",${layoutSchema},"styleMatched":false}`

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
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages,
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned no text block')
    }
    const clean = textBlock.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('generate-copy error:', e)
    const message = e?.message || 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
