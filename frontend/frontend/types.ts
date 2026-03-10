export enum ToolType {
  VIDEO_VEO = "VIDEO_VEO",
  IMAGE_NANO = "IMAGE_NANO"
}

export enum Lighting {
  STUDIO_SOFTBOX = "studio_softbox",
  CINEMATIC = "cinematic",
  DRAMATIC = "dramatic",
  NATURAL = "natural",
  NEON = "neon"
}

export enum MotionStyle {
  NORMAL = "normal",
  TIMELAPSE = "timelapse",
  SPEEDRAMP = "speedramp",
  SLOWMOTION = "slowmotion"
}

export enum DesignGoal {
  POSTER = "poster",
  BRAND_LOGO = "brand_logo"
}

export interface Job {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultUrl?: string;
  metadataJsonUrl?: string;
  createdAt: number;
  toolType: ToolType;
  prompt: string;
}

export interface GenerateResponse {
  jobId: string;
  status: string;
  resultUrl?: string;
  metadataJsonUrl?: string;
}

export interface ApiError {
  message: string;
  code?: number;
}