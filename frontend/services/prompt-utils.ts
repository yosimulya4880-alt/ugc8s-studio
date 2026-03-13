export type PromptGeneratorMode = 'image' | 'video';

export type AudioType =
  | 'Narration'
  | 'Dialogue'
  | 'Voice Over'
  | 'Background Crowd'
  | 'Mixed';

export type DeliveryStyle =
  | 'Selebgram Endorse'
  | 'Reporter'
  | 'Story Teller'
  | 'Commentator'
  | 'Crowd / Audience'
  | 'Cinematic Narrator';

export type AudioTone =
  | 'Energetic'
  | 'Warm'
  | 'Calm'
  | 'Serious'
  | 'Excited'
  | 'Persuasive'
  | 'Emotional';

export type AudioPacing = 'Slow' | 'Normal' | 'Fast';

export type SpeakerCount =
  | '1 Speaker'
  | '2 Speakers'
  | '3+ Speakers'
  | 'Crowd Only';

export type LanguageStyle =
  | 'Indonesian Formal'
  | 'Indonesian Casual'
  | 'English Neutral'
  | 'English Casual'
  | 'Bilingual';

export type PromptGeneratorState = {
  lang: 'id' | 'en';
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

  // Audio builder (video mode)
  audioType: AudioType | '';
  deliveryStyle: DeliveryStyle | '';
  audioTone: AudioTone | '';
  audioPacing: AudioPacing | '';
  speakerCount: SpeakerCount | '';
  languageStyle: LanguageStyle | '';
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

  audioType: '',
  deliveryStyle: '',
  audioTone: '',
  audioPacing: '',
  speakerCount: '',
  languageStyle: '',
};

export const STYLE_PRESETS = [
  'Photorealistic',
  'Illustrative',
  'Concept Art',
  'Vector',
  '3D Realistic',
  '3D Animation',
  'Manga',
  'Doodle',
  'Oil Painting',
  'Poster Ad',
  'Logo',
  'Line Art',
  'Pencil Drawing',
  'Cinematic',
  'UGC Natural',
] as const;

export const SHOT_TYPE_PRESETS = [
  'Close Up',
  'Medium Shot',
  'Wide Shot',
  'Over the Shoulder',
  'Top Down',
  'Macro',
  'Portrait Frame',
  'Product Focus',
] as const;

export const CAMERA_ANGLE_PRESETS = [
  'Eye Level',
  'Low Angle',
  'High Angle',
  'Top Down',
  'Dutch Angle',
  'Overhead',
  'Front Facing',
  'Three Quarter View',
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
  'Moody low light',
  'Neon glow',
  'Warm indoor light',
  'Clean commercial lighting',
] as const;

export const MOOD_PRESETS = [
  'Warm',
  'Calm',
  'Playful',
  'Elegant',
  'Luxurious',
  'Dramatic',
  'Emotional',
  'Energetic',
  'Cinematic',
] as const;

export const AUDIO_TYPE_PRESETS: AudioType[] = [
  'Narration',
  'Dialogue',
  'Voice Over',
  'Background Crowd',
  'Mixed',
];

export const DELIVERY_STYLE_PRESETS: DeliveryStyle[] = [
  'Selebgram Endorse',
  'Reporter',
  'Story Teller',
  'Commentator',
  'Crowd / Audience',
  'Cinematic Narrator',
];

export const AUDIO_TONE_PRESETS: AudioTone[] = [
  'Energetic',
  'Warm',
  'Calm',
  'Serious',
  'Excited',
  'Persuasive',
  'Emotional',
];

export const AUDIO_PACING_PRESETS: AudioPacing[] = [
  'Slow',
  'Normal',
  'Fast',
];

export const SPEAKER_COUNT_PRESETS: SpeakerCount[] = [
  '1 Speaker',
  '2 Speakers',
  '3+ Speakers',
  'Crowd Only',
];

export const LANGUAGE_STYLE_PRESETS: LanguageStyle[] = [
  'Indonesian Formal',
  'Indonesian Casual',
  'English Neutral',
  'English Casual',
  'Bilingual',
];

export function mergePrompt(basePrompt: string, generatedPrompt: string): string {
  if (!generatedPrompt.trim()) return basePrompt;
  if (!basePrompt.trim()) return generatedPrompt;
  return `${basePrompt.trim()}\n\n${generatedPrompt.trim()}`;
}

function getDeliveryStyleHintId(style: DeliveryStyle | ''): string {
  switch (style) {
    case 'Selebgram Endorse':
      return 'dengan gaya bicara cepat, engaging, ekspresif, persuasif, dan terasa seperti host endorse media sosial';
    case 'Reporter':
      return 'dengan gaya bicara jelas, informatif, lugas, terstruktur, seperti reporter lapangan atau presenter berita';
    case 'Story Teller':
      return 'dengan gaya bercerita hangat, mengalir, deskriptif, imajinatif, dan emosional seperti pembaca cerita';
    case 'Commentator':
      return 'dengan gaya bicara energik, spontan, penuh penekanan, dan terasa seperti komentator live';
    case 'Crowd / Audience':
      return 'dengan nuansa suara kolektif, reaksi penonton, sorakan, gumaman, dan ambience keramaian audiens';
    case 'Cinematic Narrator':
      return 'dengan narasi sinematik yang halus, dalam, dramatis, dan terasa seperti voice-over trailer';
    default:
      return '';
  }
}

function getDeliveryStyleHintEn(style: DeliveryStyle | ''): string {
  switch (style) {
    case 'Selebgram Endorse':
      return 'with a fast, engaging, expressive, and persuasive delivery like a social media endorsement host';
    case 'Reporter':
      return 'with a clear, informative, structured delivery like a field reporter or news presenter';
    case 'Story Teller':
      return 'with a warm, flowing, descriptive, imaginative, and emotional storytelling delivery';
    case 'Commentator':
      return 'with an energetic, reactive, emphatic delivery like a live commentator';
    case 'Crowd / Audience':
      return 'with layered crowd ambience, audience reactions, cheering, murmurs, and public energy';
    case 'Cinematic Narrator':
      return 'with a smooth, deep, dramatic cinematic narration like a trailer voice-over';
    default:
      return '';
  }
}

function buildCorePromptId(state: PromptGeneratorState, mode: PromptGeneratorMode): string {
  const parts = [
    state.subject ? `Subjek: ${state.subject}.` : '',
    state.setting ? `Lokasi/setting: ${state.setting}.` : '',
    state.style ? `Gaya visual: ${state.style}.` : '',
    state.shotType ? `Jenis shot: ${state.shotType}.` : '',
    state.cameraAngle ? `Sudut kamera: ${state.cameraAngle}.` : '',
    state.lensFeel ? `Nuansa lensa: ${state.lensFeel}.` : '',
    state.lighting ? `Pencahayaan: ${state.lighting}.` : '',
    state.mood ? `Mood: ${state.mood}.` : '',
  ].filter(Boolean);

  if (mode === 'video') {
    const movementText = state.cameraMovement.length
      ? state.cameraMovement.join(', ')
      : 'kamera stabil';
    parts.push(`Pergerakan kamera: ${movementText}.`);
  }

  if (mode === 'image' && state.extraDetails.trim()) {
    parts.push(`Komposisi/detail tambahan: ${state.extraDetails.trim()}.`);
  }

  parts.push(
    'Kualitas tinggi, detail tajam, komposisi rapi, hasil natural dan konsisten.'
  );

  return parts.join(' ');
}

function buildCorePromptEn(state: PromptGeneratorState, mode: PromptGeneratorMode): string {
  const parts = [
    state.subject ? `Subject: ${state.subject}.` : '',
    state.setting ? `Setting: ${state.setting}.` : '',
    state.style ? `Visual style: ${state.style}.` : '',
    state.shotType ? `Shot type: ${state.shotType}.` : '',
    state.cameraAngle ? `Camera angle: ${state.cameraAngle}.` : '',
    state.lensFeel ? `Lens feel: ${state.lensFeel}.` : '',
    state.lighting ? `Lighting: ${state.lighting}.` : '',
    state.mood ? `Mood: ${state.mood}.` : '',
  ].filter(Boolean);

  if (mode === 'video') {
    const movementText = state.cameraMovement.length
      ? state.cameraMovement.join(', ')
      : 'stable camera';
    parts.push(`Camera movement: ${movementText}.`);
  }

  if (mode === 'image' && state.extraDetails.trim()) {
    parts.push(`Composition / extra direction: ${state.extraDetails.trim()}.`);
  }

  parts.push(
    'High quality, sharp details, clean composition, natural and consistent output.'
  );

  return parts.join(' ');
}

function buildAudioBlockId(state: PromptGeneratorState): string {
  const descriptors: string[] = [];

  if (state.audioType) {
    descriptors.push(`tipe audio ${state.audioType.toLowerCase()}`);
  }

  if (state.audioTone) {
    descriptors.push(`tone ${state.audioTone.toLowerCase()}`);
  }

  if (state.audioPacing) {
    descriptors.push(`tempo ${state.audioPacing.toLowerCase()}`);
  }

  if (state.speakerCount) {
    descriptors.push(`jumlah speaker ${state.speakerCount.toLowerCase()}`);
  }

  if (state.languageStyle) {
    descriptors.push(`gaya bahasa ${state.languageStyle.toLowerCase()}`);
  }

  const deliveryHint = getDeliveryStyleHintId(state.deliveryStyle);

  const base =
    descriptors.length > 0
      ? `Audio direction: buat arahan audio dengan ${descriptors.join(', ')}`
      : 'Audio direction: buat arahan audio yang natural dan sinkron dengan video';

  const styleSentence = deliveryHint ? `, ${deliveryHint}` : '';

  const closing =
    state.deliveryStyle === 'Selebgram Endorse'
      ? '. Fokus pada penyampaian yang menarik perhatian, terasa natural, dan cocok untuk konten promosi singkat.'
      : state.deliveryStyle === 'Reporter'
      ? '. Fokus pada penyampaian yang jelas, informatif, terstruktur, dan mudah dipahami.'
      : state.deliveryStyle === 'Story Teller'
      ? '. Fokus pada alur cerita yang mengalir, membangun suasana, dan terasa hidup.'
      : state.deliveryStyle === 'Commentator'
      ? '. Fokus pada energi spontan, penekanan momen, dan reaksi yang terasa dinamis.'
      : state.deliveryStyle === 'Crowd / Audience'
      ? '. Fokus pada ambience keramaian yang terasa hidup, natural, dan mendukung suasana adegan.'
      : state.deliveryStyle === 'Cinematic Narrator'
      ? '. Fokus pada narasi yang halus, dramatis, mendalam, dan sinematik.'
      : '.';

  const details = state.extraDetails.trim()
    ? `\n${state.extraDetails.trim()}`
    : '';

  return `${base}${styleSentence}${closing}${details}`;
}

function buildAudioBlockEn(state: PromptGeneratorState): string {
  const descriptors: string[] = [];

  if (state.audioType) {
    descriptors.push(`${state.audioType.toLowerCase()} audio`);
  }

  if (state.audioTone) {
    descriptors.push(`${state.audioTone.toLowerCase()} tone`);
  }

  if (state.audioPacing) {
    descriptors.push(`${state.audioPacing.toLowerCase()} pacing`);
  }

  if (state.speakerCount) {
    descriptors.push(`${state.speakerCount.toLowerCase()}`);
  }

  if (state.languageStyle) {
    descriptors.push(`${state.languageStyle.toLowerCase()} language style`);
  }

  const deliveryHint = getDeliveryStyleHintEn(state.deliveryStyle);

  const base =
    descriptors.length > 0
      ? `Audio direction: create audio guidance with ${descriptors.join(', ')}`
      : 'Audio direction: create natural audio guidance that feels synced with the video';

  const styleSentence = deliveryHint ? `, ${deliveryHint}` : '';

  const closing =
    state.deliveryStyle === 'Selebgram Endorse'
      ? '. Focus on attention-grabbing, natural, engaging delivery suitable for short promotional content.'
      : state.deliveryStyle === 'Reporter'
      ? '. Focus on clarity, structure, informative delivery, and easy-to-follow speech.'
      : state.deliveryStyle === 'Story Teller'
      ? '. Focus on flowing narration, emotional storytelling, and immersive atmosphere.'
      : state.deliveryStyle === 'Commentator'
      ? '. Focus on reactive energy, emphatic delivery, and dynamic live commentary feel.'
      : state.deliveryStyle === 'Crowd / Audience'
      ? '. Focus on lively audience ambience, layered reactions, and natural public atmosphere.'
      : state.deliveryStyle === 'Cinematic Narrator'
      ? '. Focus on smooth, dramatic, deep narration with a cinematic trailer-like feel.'
      : '.';

  const details = state.extraDetails.trim()
    ? `\n${state.extraDetails.trim()}`
    : '';

  return `${base}${styleSentence}${closing}${details}`;
}

export function buildGeneratedPrompt(
  state: PromptGeneratorState,
  mode: PromptGeneratorMode = 'video'
): string {
  const isId = state.lang === 'id';

  const core = isId
    ? buildCorePromptId(state, mode)
    : buildCorePromptEn(state, mode);

  if (mode === 'image') {
    return core;
  }

  const audio = isId ? buildAudioBlockId(state) : buildAudioBlockEn(state);

  return [core, audio].filter(Boolean).join('\n\n');
}
