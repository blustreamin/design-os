export const CREATIVE_TYPES = {
  'Instagram Post': [
    { label: 'Square (1:1)', w: 1080, h: 1080 },
    { label: 'Portrait (4:5)', w: 1080, h: 1350 },
    { label: 'Story (9:16)', w: 1080, h: 1920 },
  ],
  'Poster': [
    { label: 'A4 Portrait', w: 2480, h: 3508 },
    { label: 'A3 Landscape', w: 4961, h: 3508 },
    { label: 'Standard (18×24in)', w: 1800, h: 2400 },
  ],
  'Carousel': [
    { label: 'Square (1:1)', w: 1080, h: 1080 },
    { label: 'Landscape (1.91:1)', w: 1080, h: 566 },
  ],
  'Brochure': [
    { label: 'Tri-fold A4', w: 3508, h: 2480 },
    { label: 'Bi-fold A4', w: 4961, h: 3508 },
  ],
  'Pitch Deck': [
    { label: 'Widescreen (16:9)', w: 1920, h: 1080 },
    { label: 'Standard (4:3)', w: 1024, h: 768 },
  ],
}

export type CreativeType = keyof typeof CREATIVE_TYPES
