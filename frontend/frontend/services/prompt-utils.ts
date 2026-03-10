export type LangMode = 'id' | 'en';
export type PromptGeneratorMode = 'image' | 'video';

export type PromptGeneratorState = {
  lang: LangMode;
  style: string;
  shotType: string;
  cameraAngle: string;
  lensFeel: string;
  cameraMovement: string[];
  lighting: string;
  mood: string;
  subject: string;
  setting: string;
  extraDetails: string;
};

export const DEFAULT_PROMPT_GENERATOR_STATE: PromptGeneratorState = {
  lang: 'id',
  style: '',
  shotType: '',
  cameraAngle: '',
  lensFeel: '',
  cameraMovement: [],
  lighting: '',
  mood: '',
  subject: '',
  setting: '',
  extraDetails: '',
};

export const STYLE_PRESETS = [
  'Hyper Realistic',
  'Cinematic',
  '3D Pixar',
  '3D Realistic',
  'Animation',
  'Doodle',
  'Anime',
  'Commercial Product Ad',
  'Documentary',
  'UGC Natural',
] as const;

export const SHOT_TYPE_PRESETS = [
  'Close Up',
  'Medium Shot',
  'Wide Shot',
  'Over Shoulder',
  'Top Down',
  'Low Angle Shot',
  'Eye Level Shot',
  'Macro Shot',
] as const;

export const CAMERA_ANGLE_PRESETS = [
  'Eye Level',
  'Low Angle',
  'High Angle',
  'Top Down',
  'Dutch Angle',
  'Over the Shoulder',
] as const;

export const LENS_FEEL_PRESETS = [
  '24mm wide',
  '35mm natural',
  '50mm cinematic',
  '85mm portrait',
  'Macro lens',
] as const;

export const CAMERA_MOVEMENT_PRESETS = [
  'Static',
  'Handheld',
  'Dolly In',
  'Dolly Out',
  'Pan Left',
  'Pan Right',
  'Tilt Up',
  'Tilt Down',
  'Orbit',
  'Slow Push In',
] as const;

export const LIGHTING_PRESETS = [
  'Soft daylight',
  'Golden hour',
  'Studio softbox',
  'Dramatic contrast',
  'Neon glow',
  'Moody low light',
] as const;

export const MOOD_PRESETS = [
  'Warm',
  'Energetic',
  'Elegant',
  'Moody',
  'Playful',
  'Premium',
  'Natural',
] as const;

export function buildGeneratedPrompt(state: PromptGeneratorState, mode: PromptGeneratorMode = 'video'): string {
  const movementText = state.cameraMovement.length
    ? state.cameraMovement.join(', ')
    : state.lang === 'id'
      ? 'kamera stabil'
      : 'stable camera';

  if (state.lang === 'id') {
    if (mode === 'image') {
      return [
        state.subject ? `Subjek: ${state.subject}.` : '',
        state.setting ? `Lokasi/setting: ${state.setting}.` : '',
        state.shotType ? `Komposisi/jenis shot: ${state.shotType}.` : '',
        state.cameraAngle ? `Sudut kamera: ${state.cameraAngle}.` : '',
        state.lensFeel ? `Nuansa lensa: ${state.lensFeel}.` : '',
        state.lighting ? `Pencahayaan: ${state.lighting}.` : '',
        state.mood ? `Mood: ${state.mood}.` : '',
        'Kualitas tinggi, detail tajam, komposisi rapi, hasil natural dan konsisten.',
      ]
        .filter(Boolean)
        .join(' ');
    }

    return [
      state.subject ? `Subjek: ${state.subject}.` : '',
      state.setting ? `Lokasi/setting: ${state.setting}.` : '',
      state.style ? `Gaya visual: ${state.style}.` : '',
      state.shotType ? `Jenis shot: ${state.shotType}.` : '',
      state.cameraAngle ? `Sudut kamera: ${state.cameraAngle}.` : '',
      state.lensFeel ? `Nuansa lensa: ${state.lensFeel}.` : '',
      `Pergerakan kamera: ${movementText}.`,
      state.lighting ? `Pencahayaan: ${state.lighting}.` : '',
      state.mood ? `Mood: ${state.mood}.` : '',
      state.extraDetails ? `Arahan audio/dialog: ${state.extraDetails}.` : '',
      'Kualitas tinggi, detail tajam, komposisi rapi, hasil natural dan konsisten.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (mode === 'image') {
    return [
      state.subject ? `Subject: ${state.subject}.` : '',
      state.setting ? `Setting: ${state.setting}.` : '',
      state.shotType ? `Composition / shot type: ${state.shotType}.` : '',
      state.cameraAngle ? `Camera angle: ${state.cameraAngle}.` : '',
      state.lensFeel ? `Lens feel: ${state.lensFeel}.` : '',
      state.lighting ? `Lighting: ${state.lighting}.` : '',
      state.mood ? `Mood: ${state.mood}.` : '',
      'High quality, sharp details, clean composition, natural and consistent output.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    state.subject ? `Subject: ${state.subject}.` : '',
    state.setting ? `Setting: ${state.setting}.` : '',
    state.style ? `Visual style: ${state.style}.` : '',
    state.shotType ? `Shot type: ${state.shotType}.` : '',
    state.cameraAngle ? `Camera angle: ${state.cameraAngle}.` : '',
    state.lensFeel ? `Lens feel: ${state.lensFeel}.` : '',
    `Camera movement: ${movementText}.`,
    state.lighting ? `Lighting: ${state.lighting}.` : '',
    state.mood ? `Mood: ${state.mood}.` : '',
    state.extraDetails ? `Audio / dialogue direction: ${state.extraDetails}.` : '',
    'High quality, sharp details, clean composition, natural and consistent output.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function mergePrompt(basePrompt: string, generatedPrompt: string): string {
  if (!generatedPrompt.trim()) return basePrompt;
  if (!basePrompt.trim()) return generatedPrompt;
  return `${basePrompt.trim()}\n\n${generatedPrompt.trim()}`;
}
