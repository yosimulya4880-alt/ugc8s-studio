import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ToolType,
  Lighting,
  MotionStyle,
  Job
} from './types';
import { generateMedia, signUpload, getJob } from './services/api';
import { Button } from './components/ui/Button';
import { FileUploader } from './components/ui/FileUploader';
import JobCard from './components/JobCard';
import PromptGeneratorPanel from './components/PromptGeneratorPanel';
import { DEFAULT_PROMPT_GENERATOR_STATE } from './services/prompt-utils';
import {
  Video,
  Image as ImageIcon,
  Wand2,
  Settings2,
  History,
  Zap,
  Lock,
  Save,
  Trash2,
  CheckCircle2
} from 'lucide-react';

const IMAGE_GENERATION_TYPES = [
  { value: 'text', label: 'Text to Image', description: 'Generate from prompt only, without any reference image.' },
  { value: 'reference', label: 'Reference-based Image', description: 'Generate using one or more reference images.' },
] as const;

type ImageGenerationType = typeof IMAGE_GENERATION_TYPES[number]['value'];

const IMAGE_OUTPUT_TYPES = [
  'Illustration',
  'Product Photo',
  'Portrait',
  'Scene Image',
  'Poster Ad',
  'Logo',
  'Social Media Post',
  'Packaging Concept',
] as const;

const IMAGE_VISUAL_STYLES = [
  'Photorealistic',
  'Illustrative',
  'Concept Art',
  'Vector',
  '3D Realistic',
  '3D Animation',
  'Manga',
  'Doodle',
  'Oil Painting',
  'Line Art',
  'Pencil Drawing',
  'Minimalist',
] as const;

const IMAGE_ASPECT_RATIOS = [
  'Auto',
  '1:1',
  '9:16',
  '16:9',
  '3:4',
  '4:3',
  '3:2',
  '2:3',
  '5:4',
  '4:5',
  '21:9',
  '4:1',
  '1:4',
  '8:1',
  '1:8',
] as const;

const IMAGE_RESOLUTIONS = ['1K', '2K', '4K'] as const;

const VIDEO_GENERATION_TYPES = [
  { value: 'text', label: 'Text to Video', description: 'Generate a video from prompt only.' },
  { value: 'image', label: 'Image to Video', description: 'Use one main image as the starting visual reference.' },
  { value: 'frames', label: 'Start / End Frame', description: 'Generate motion between a start frame and an end frame.' },
] as const;

type VideoGenerationType = typeof VIDEO_GENERATION_TYPES[number]['value'];

const loadState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
};

type AppSection = 'studio' | 'kling';

const VIDEO_MODEL_MODES = [
  { value: 'fast', label: 'Fast', description: 'Faster generation, lower cost.' },
  { value: 'quality', label: 'Quality', description: 'Higher quality, better prompt adherence.' },
] as const;

type VideoModelMode = typeof VIDEO_MODEL_MODES[number]['value'];

const StudioApp: React.FC = () => {
  const [mode, setMode] = useState<ToolType>(() => loadState('ugc8s_mode', ToolType.VIDEO_VEO));
  const [apiToken, setApiToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('ugc8s_api_token') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [section, setSection] = useState<AppSection>(() => loadState('ugc8s_section', 'studio'));

  const [jobs, setJobs] = useState<Job[]>(() => {
    const loaded = loadState<Job[]>('ugc8s_jobs', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const jobsRef = useRef<Job[]>(jobs);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const tokenRef = useRef<string>(apiToken);
  useEffect(() => {
    tokenRef.current = apiToken;
  }, [apiToken]);

  const mergeServerJob = useCallback((prev: Job, server: any): Job => {
    const status = mapStatus(server?.status);
    return {
      ...prev,
      status,
      updatedAt: server?.updatedAt || new Date().toISOString(),
      createdAt: prev.createdAt || server?.createdAt || new Date().toISOString(),
      provider: server?.provider ?? prev.provider,
      result: server?.result ?? prev.result ?? null,
      error: server?.error ?? prev.error ?? null,
      resultUrl: server?.result?.url || server?.resultUrl || prev.resultUrl,
      metadataJsonUrl: server?.metadataJsonUrl || prev.metadataJsonUrl,
    } as any;
  }, []);

  const refreshJob = useCallback(async (jobId: string) => {
    const token = tokenRef.current;
    if (!token) return;

    try {
      const server = await getJob(jobId, token);
      setJobs((prev) => prev.map((j) => (j.jobId === jobId ? mergeServerJob(j, server) : j)));
    } catch (e) {
      console.warn('refreshJob failed', e);
    }
  }, [mergeServerJob]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const token = tokenRef.current;
      if (!token) return;

      const pending = jobsRef.current.filter((j: any) => j.status === 'running' || j.status === 'queued');
      if (!pending.length) return;

      pending.slice(0, 3).forEach((j) => {
        refreshJob((j as any).jobId);
      });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [refreshJob]);

  const [prompt, setPrompt] = useState(() => loadState('ugc8s_prompt', ''));
  const [negativePrompt, setNegativePrompt] = useState(() => loadState('ugc8s_negativePrompt', ''));
  const [styleLock, setStyleLock] = useState(() => loadState('ugc8s_styleLock', true));
  const [lighting, setLighting] = useState<Lighting>(() => loadState('ugc8s_lighting', Lighting.STUDIO_SOFTBOX));
  const [motionStyle, setMotionStyle] = useState<MotionStyle>(() => loadState('ugc8s_motionStyle', MotionStyle.NORMAL));
  const [aspectRatio, setAspectRatio] = useState(() => loadState('ugc8s_aspectRatio', '16:9'));
  const [resolution, setResolution] = useState(() => loadState('ugc8s_resolution', '720p'));
  const [durationSeconds, setDurationSeconds] = useState(() => loadState('ugc8s_durationSeconds', '8'));
  const [videoModelMode, setVideoModelMode] = useState<VideoModelMode>(() => loadState('ugc8s_videoModelMode', 'fast'));
  const [videoGenerationType, setVideoGenerationType] = useState<VideoGenerationType>(() => loadState('ugc8s_videoGenerationType', 'text'));
  const [promptGen, setPromptGen] = useState(DEFAULT_PROMPT_GENERATOR_STATE);

  const [imageGenerationType, setImageGenerationType] = useState<ImageGenerationType>(() => loadState('ugc8s_imageGenerationType', 'text'));
  const [imageOutputType, setImageOutputType] = useState<string>(() => loadState('ugc8s_imageOutputType', 'Illustration'));
  const [imageVisualStyle, setImageVisualStyle] = useState<string>(() => loadState('ugc8s_imageVisualStyle', 'Illustrative'));
  const [imageAspectRatio, setImageAspectRatio] = useState(() => loadState('ugc8s_imageAspectRatio', 'Auto'));
  const [imageResolution, setImageResolution] = useState(() => loadState('ugc8s_imageResolution', '1K'));

  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [startFrame, setStartFrame] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  const persist = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Save failed', e);
    }
  }, []);

  useEffect(() => persist('ugc8s_mode', mode), [mode, persist]);
  useEffect(() => persist('ugc8s_section', section), [section, persist]);
  useEffect(() => persist('ugc8s_prompt', prompt), [prompt, persist]);
  useEffect(() => persist('ugc8s_negativePrompt', negativePrompt), [negativePrompt, persist]);
  useEffect(() => persist('ugc8s_styleLock', styleLock), [styleLock, persist]);
  useEffect(() => persist('ugc8s_lighting', lighting), [lighting, persist]);
  useEffect(() => persist('ugc8s_motionStyle', motionStyle), [motionStyle, persist]);
  useEffect(() => persist('ugc8s_aspectRatio', aspectRatio), [aspectRatio, persist]);
  useEffect(() => persist('ugc8s_resolution', resolution), [resolution, persist]);
  useEffect(() => persist('ugc8s_durationSeconds', durationSeconds), [durationSeconds, persist]);
  useEffect(() => persist('ugc8s_videoModelMode', videoModelMode), [videoModelMode, persist]);
  useEffect(() => persist('ugc8s_videoGenerationType', videoGenerationType), [videoGenerationType, persist]);
  useEffect(() => persist('ugc8s_imageGenerationType', imageGenerationType), [imageGenerationType, persist]);
  useEffect(() => persist('ugc8s_imageOutputType', imageOutputType), [imageOutputType, persist]);
  useEffect(() => persist('ugc8s_imageVisualStyle', imageVisualStyle), [imageVisualStyle, persist]);
  useEffect(() => persist('ugc8s_imageAspectRatio', imageAspectRatio), [imageAspectRatio, persist]);
  useEffect(() => persist('ugc8s_imageResolution', imageResolution), [imageResolution, persist]);

  useEffect(() => {
    persist('ugc8s_jobs', jobs.slice(0, 50));
  }, [jobs, persist]);

  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('ugc8s_api_token', apiToken);
      setLastSavedTime(new Date().toLocaleTimeString());
    }
  }, [apiToken]);

  const saveCheckpoint = () => {
    persist('ugc8s_mode', mode);
    persist('ugc8s_prompt', prompt);
    persist('ugc8s_videoModelMode', videoModelMode);
    persist('ugc8s_videoGenerationType', videoGenerationType);
    persist('ugc8s_jobs', jobs);
    persist('ugc8s_imageGenerationType', imageGenerationType);
    persist('ugc8s_imageOutputType', imageOutputType);
    persist('ugc8s_imageVisualStyle', imageVisualStyle);
    persist('ugc8s_imageAspectRatio', imageAspectRatio);
    persist('ugc8s_imageResolution', imageResolution);
    alert(`Checkpoint Saved at ${new Date().toLocaleTimeString()}!\n\nNote: Images cannot be saved due to browser security.`);
  };

  const clearHistory = () => {
    if (window.confirm('Hapus semua history job?')) {
      setJobs([]);
      localStorage.removeItem('ugc8s_jobs');
    }
  };

  const mapStatus = (s: any): any => {
    const v = String(s || '');
    if (v === 'queued' || v === 'running' || v === 'succeeded' || v === 'failed') return v;
    if (v === 'PENDING') return 'queued';
    if (v === 'PROCESSING') return 'running';
    if (v === 'COMPLETED') return 'succeeded';
    if (v === 'FAILED') return 'failed';
    return 'queued';
  };

  const guessMime = (name: string) => {
    const s = (name || '').toLowerCase();
    if (s.endsWith('.png')) return 'image/png';
    if (s.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  };

  const uploadToGcs = async (file: File, jobId: string, kind: 'hero' | 'ref' | 'startFrame' | 'endFrame') => {
    const signed = await signUpload({
      jobId,
      kind,
      filename: file.name,
      contentType: file.type || guessMime(file.name) || 'application/octet-stream',
    }, apiToken);

    const putRes = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || guessMime(file.name) || 'application/octet-stream' },
      body: file,
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      throw new Error(`Upload failed (${putRes.status}): ${t}`);
    }
    return signed.gcsPath as string;
  };

  const buildImagePromptContext = () => {
    const parts = [
      `Output type: ${imageOutputType}.`,
      `Visual style: ${imageVisualStyle}.`,
      imageAspectRatio !== 'Auto' ? `Aspect ratio: ${imageAspectRatio}.` : '',
      imageResolution ? `Target resolution: ${imageResolution}.` : '',
      styleLock ? 'Keep the visual style consistent.' : '',
      imageGenerationType === 'reference'
        ? 'Use the uploaded references to guide subject identity, shape, material, and composition.'
        : 'Generate from text only without requiring a reference image.',
    ].filter(Boolean);

    return parts.join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiToken) {
      alert('API Token belum diisi. Isi dulu token (ugc8s-demo-123).');
      setShowTokenInput(true);
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      alert('Prompt wajib diisi.');
      return;
    }

    const effectiveUseMock = false;
    const isImageMode = mode === ToolType.IMAGE_NANO;
    const isReferenceImageMode = isImageMode && imageGenerationType === 'reference';

    if (mode === ToolType.VIDEO_VEO) {
      if (videoGenerationType === 'image' && !heroImage) {
        alert('Please upload a main image for Image to Video mode.');
        return;
      }

      if (videoGenerationType === 'frames' && (!startFrame || !endFrame)) {
        alert('Please upload both Start Frame and End Frame.');
        return;
      }
    }

    if (isReferenceImageMode && !heroImage && referenceImages.length === 0) {
      alert('Untuk Reference-based Image, upload minimal 1 gambar referensi.');
      return;
    }

    const trimmedNegativePrompt = negativePrompt.trim();
    const basePrompt = isImageMode
      ? `${trimmedPrompt}\n\nImage settings:\n${buildImagePromptContext()}`
      : trimmedPrompt;

    const finalPrompt = trimmedNegativePrompt
      ? `${basePrompt}\n\nAvoid / Negative:\n${trimmedNegativePrompt}`
      : basePrompt;

    setIsSubmitting(true);

    try {
      const clientJobId = `job_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

      let heroImageGcsPath: string | null = null;
      const referenceImageGcsPaths: string[] = [];
      let startFrameGcsPath: string | null = null;
      let endFrameGcsPath: string | null = null;

      if (!effectiveUseMock) {
        if (
          heroImage &&
          (
            (isImageMode && isReferenceImageMode) ||
            (mode === ToolType.VIDEO_VEO && videoGenerationType === 'image')
          )
        ) {
          heroImageGcsPath = await uploadToGcs(heroImage, clientJobId, 'hero');
        }

        const refsToUpload = isImageMode && isReferenceImageMode ? referenceImages : [];
        for (const f of refsToUpload) {
          referenceImageGcsPaths.push(await uploadToGcs(f, clientJobId, 'ref'));
        }

        if (mode === ToolType.VIDEO_VEO) {
          if (startFrame) startFrameGcsPath = await uploadToGcs(startFrame, clientJobId, 'startFrame');
          if (endFrame) endFrameGcsPath = await uploadToGcs(endFrame, clientJobId, 'endFrame');
        }
      }

      const formData = new FormData();
      formData.append('jobId', clientJobId);
      formData.append('prompt', finalPrompt);
      formData.append('lighting', lighting);
      formData.append('toolType', mode);
      formData.append('styleLock', String(styleLock));

      if (heroImageGcsPath) formData.append('heroImageGcsPath', heroImageGcsPath);
      referenceImageGcsPaths.forEach((p) => formData.append('referenceImageGcsPaths', p));
      if (startFrameGcsPath) formData.append('startFrameGcsPath', startFrameGcsPath);
      if (endFrameGcsPath) formData.append('endFrameGcsPath', endFrameGcsPath);

      if (mode === ToolType.VIDEO_VEO) {
        formData.append('videoModelMode', videoModelMode);
        formData.append('videoGenerationType', videoGenerationType);
        formData.append('motionStyle', motionStyle);
        formData.append('aspectRatio', aspectRatio);
        formData.append('resolution', resolution);
        formData.append('durationSeconds', String(durationSeconds));
      } else {
        formData.append('designGoal', imageOutputType === 'Logo' ? 'brand_logo' : 'poster');
        formData.append('aspectRatio', imageAspectRatio);
        formData.append('resolution', imageResolution);
      }

      formData.append('mock', effectiveUseMock ? 'true' : 'false');

      const response: any = await generateMedia(mode, formData, apiToken);

      const newJob: Job = {
        jobId: response.jobId,
        status: mapStatus(response.status),
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        provider: response.provider,
        result: response.result ?? null,
        error: response.error ?? null,
        toolType: mode,
        prompt: finalPrompt,
        resultUrl: response.result?.url || response.resultUrl,
        metadataJsonUrl: response.metadataJsonUrl,
      } as any;

      setJobs((prev) => [newJob, ...prev]);
      setTimeout(() => refreshJob((newJob as any).jobId), 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to start generation job. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs((prev) => prev.map((j) => ((j as any).jobId === (updatedJob as any).jobId ? updatedJob : j)));
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 8, right: 12, fontSize: 12, opacity: 0.7, zIndex: 9999, textAlign: 'right' }}>
        <div className="font-mono text-xs text-gray-400">v2026-03-10-video-layout-refactor</div>
        {lastSavedTime && (
          <div className="text-green-400 text-[10px] flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Saved: {lastSavedTime}
          </div>
        )}
      </div>

      <div className="flex h-screen overflow-hidden bg-background text-white">
        <aside className="w-64 border-r border-white/10 bg-surface flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white">
                <Zap className="w-5 h-5" fill="currentColor" />
              </div>
              Nexus Studio
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Creative Studio</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                setSection('studio');
                setMode(ToolType.VIDEO_VEO);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                section === 'studio' && mode === ToolType.VIDEO_VEO
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Video className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Video Mode</div>
                <div className="text-xs opacity-70">Veo Model</div>
              </div>
            </button>

            <button
              onClick={() => {
                setSection('studio');
                setMode(ToolType.IMAGE_NANO);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                section === 'studio' && mode === ToolType.IMAGE_NANO
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Image Mode</div>
                <div className="text-xs opacity-70">Nano Model</div>
              </div>
            </button>

            <button
              onClick={() => setSection('kling')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                section === 'kling'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Video className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Kling.AI</div>
                <div className="text-xs opacity-70">Coming Soon</div>
              </div>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full px-2 py-1"
            >
              <Settings2 className="w-3 h-3" />
              API Configuration
            </button>
            {showTokenInput && (
              <div className="mb-2">
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-primary outline-none"
                  placeholder="Bearer Token"
                />
              </div>
            )}

            <button
              onClick={saveCheckpoint}
              className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition-colors w-full px-2 py-1 hover:bg-green-500/10 rounded border border-green-500/20"
            >
              <Save className="w-3 h-3" />
              Save Checkpoint
            </button>

            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full px-2 py-1 hover:bg-red-500/10 rounded border border-red-500/20"
            >
              <Trash2 className="w-3 h-3" />
              Clear History
            </button>
          </div>
        </aside>

        {section === 'studio' ? (
          <main className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 border-r border-white/10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Generate {mode === ToolType.VIDEO_VEO ? 'Video' : 'Image'}
                  </h1>
                  <p className="text-gray-400">
                    Create stunning {mode === ToolType.VIDEO_VEO ? 'videos with Veo' : 'images with Nano'} using advanced AI controls.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {mode === ToolType.VIDEO_VEO && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-200">Video Generation Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {VIDEO_GENERATION_TYPES.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setVideoGenerationType(option.value)}
                              className={`rounded-2xl border p-4 text-left transition-all ${
                                videoGenerationType === option.value
                                  ? 'border-white bg-white text-black'
                                  : 'border-white/10 bg-white/5 text-white hover:border-white/25'
                              }`}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className={`text-xs mt-1 ${videoGenerationType === option.value ? 'text-black/70' : 'text-gray-400'}`}>
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <PromptGeneratorPanel
                        mode="video"
                        value={promptGen}
                        onChange={setPromptGen}
                        currentPrompt={prompt}
                        onInsert={setPrompt}
                        onReset={() => setPromptGen(DEFAULT_PROMPT_GENERATOR_STATE)}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">
                          Prompt <span className="text-primary">*</span>
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe your video in detail..."
                          className="w-full h-32 bg-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">Negative Prompt</label>
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="What to avoid in the generated video..."
                          className="w-full h-24 bg-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                        />
                        <p className="text-xs text-gray-500">Isi negative prompt akan otomatis ditambahkan saat proses generate.</p>
                      </div>

                      {videoGenerationType === 'image' && (
                        <FileUploader
                          label="Main Image"
                          required
                          onChange={(files) => setHeroImage(files[0] || null)}
                          description="Upload one main image to generate a video from it."
                        />
                      )}

                      {videoGenerationType === 'frames' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FileUploader
                            label="Start Frame"
                            required
                            onChange={(files) => setStartFrame(files[0] || null)}
                            description="Upload the opening frame."
                          />
                          <FileUploader
                            label="End Frame"
                            required
                            onChange={(files) => setEndFrame(files[0] || null)}
                            description="Upload the ending frame."
                          />
                        </div>
                      )}

                      <div className="rounded-2xl border border-white/10 bg-black/10 p-5 space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-white">Video Settings</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Choose engine, style, and output preferences.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setStyleLock(!styleLock)}
                            className={`inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                              styleLock
                                ? 'bg-primary/10 border-primary/50 text-primary'
                                : 'bg-surface border-white/10 text-gray-400'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Style Lock
                            </span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${styleLock ? 'bg-primary' : 'bg-gray-600'}`}>
                              <div
                                className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform"
                                style={{ left: styleLock ? 'calc(100% - 14px)' : '2px' }}
                              />
                            </div>
                          </button>
                        </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  <div className="space-y-2 h-full flex flex-col">
    <label className="block text-sm font-medium text-gray-200">Video Engine</label>
    <div className="grid grid-cols-2 gap-2 flex-1">
      {VIDEO_MODEL_MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setVideoModelMode(item.value)}
          className={`h-full min-h-[116px] rounded-xl border px-4 py-4 text-left transition-all flex flex-col justify-between ${
            videoModelMode === item.value
              ? 'bg-white text-black border-white'
              : 'bg-surface border-white/10 text-white hover:border-white/25'
          }`}
        >
          <div className="font-medium">{item.label}</div>
          <div
            className={`text-xs mt-2 leading-5 ${
              videoModelMode === item.value ? 'text-black/70' : 'text-gray-400'
            }`}
          >
            {item.description}
          </div>
        </button>
      ))}
    </div>
  </div>

  <div className="space-y-2 h-full flex flex-col">
    <label className="block text-sm font-medium text-gray-200">Video Style</label>
    <div className="grid grid-cols-2 gap-2 flex-1">
      {Object.values(MotionStyle).map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => setMotionStyle(style)}
          className={`w-full min-h-[52px] px-3 py-3 rounded-lg text-sm border transition-all ${
            motionStyle === style
              ? 'bg-white text-black border-white font-medium'
              : 'bg-surface border-white/10 text-gray-400 hover:border-white/30'
          }`}
        >
          {style === 'slowmotion'
            ? 'Slow Motion'
            : style.charAt(0).toUpperCase() + style.slice(1)}
        </button>
      ))}
    </div>
  </div>
</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">Aspect Ratio</label>
                            <select
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                            >
                              <option value="16:9">16:9</option>
                              <option value="9:16">9:16</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">Resolution</label>
                            <select
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                            >
                              <option value="720p">720p</option>
                              <option value="1080p">1080p</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">Duration</label>
                            <select
                              value={durationSeconds}
                              onChange={(e) => setDurationSeconds(e.target.value)}
                              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                            >
                              <option value="4">4 sec</option>
                              <option value="6">6 sec</option>
                              <option value="8">8 sec</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {mode === ToolType.IMAGE_NANO && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-200">Generation Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {IMAGE_GENERATION_TYPES.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setImageGenerationType(option.value)}
                              className={`rounded-2xl border p-4 text-left transition-all ${
                                imageGenerationType === option.value
                                  ? 'border-white bg-white text-black'
                                  : 'border-white/10 bg-white/5 text-white hover:border-white/25'
                              }`}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className={`text-xs mt-1 ${imageGenerationType === option.value ? 'text-black/70' : 'text-gray-400'}`}>
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">
                          Prompt <span className="text-primary">*</span>
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe your vision in detail..."
                          className="w-full h-32 bg-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">Negative Prompt</label>
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="What to avoid in the generated image..."
                          className="w-full h-24 bg-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                        />
                        <p className="text-xs text-gray-500">Isi negative prompt akan otomatis ditambahkan saat proses generate.</p>
                      </div>

                      <PromptGeneratorPanel
                        mode="image"
                        value={promptGen}
                        onChange={setPromptGen}
                        currentPrompt={prompt}
                        onInsert={setPrompt}
                        onReset={() => setPromptGen(DEFAULT_PROMPT_GENERATOR_STATE)}
                      />

                      {imageGenerationType === 'reference' && (
                        <>
                          <FileUploader
                            label="Primary Reference Image"
                            required={referenceImages.length === 0}
                            onChange={(files) => setHeroImage(files[0] || null)}
                            description="Optional if you already upload reference images below. Use this for the main subject or style anchor."
                          />

                          <FileUploader
                            label="Reference Images"
                            multiple
                            maxFiles={3}
                            onChange={setReferenceImages}
                            description="Combine up to 3 additional images for subject, style, color, or scene guidance."
                          />
                        </>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-200">Output Type</label>
                          <select
                            value={imageOutputType}
                            onChange={(e) => setImageOutputType(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                          >
                            {IMAGE_OUTPUT_TYPES.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-200">Visual Style</label>
                          <select
                            value={imageVisualStyle}
                            onChange={(e) => setImageVisualStyle(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                          >
                            {IMAGE_VISUAL_STYLES.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-200">Aspect Ratio</label>
                          <select
                            value={imageAspectRatio}
                            onChange={(e) => setImageAspectRatio(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                          >
                            {IMAGE_ASPECT_RATIOS.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-200">Resolution</label>
                          <select
                            value={imageResolution}
                            onChange={(e) => setImageResolution(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-primary outline-none"
                          >
                            {IMAGE_RESOLUTIONS.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-200">Style Consistency</label>
                          <button
                            type="button"
                            onClick={() => setStyleLock(!styleLock)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                              styleLock
                                ? 'bg-primary/10 border-primary/50 text-primary'
                                : 'bg-surface border-white/10 text-gray-400'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Style Lock
                            </span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${styleLock ? 'bg-primary' : 'bg-gray-600'}`}>
                              <div
                                className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform"
                                style={{ left: styleLock ? 'calc(100% - 14px)' : '2px' }}
                              />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-lg font-semibold shadow-xl shadow-primary/20"
                      isLoading={isSubmitting}
                    >
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate {mode === ToolType.VIDEO_VEO ? 'Video' : 'Image'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <div className="w-96 bg-secondary/30 border-l border-white/10 flex flex-col">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-sm">
                <h2 className="font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Job History
                </h2>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">{jobs.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {jobs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Wand2 className="w-8 h-8" />
                    </div>
                    <p className="text-sm">No jobs generated yet</p>
                  </div>
                ) : (
                  jobs.map((job: any) => (
                    <JobCard
                      key={job.jobId}
                      job={job}
                      onUpdate={handleJobUpdate}
                      token={apiToken}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="max-w-3xl mx-auto min-h-full flex items-center justify-center">
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Video className="h-7 w-7" />
                </div>
                <div className="text-3xl font-bold mb-3">Kling.AI</div>
                <div className="text-lg text-white/80 mb-4">Coming Soon</div>
                <div className="mx-auto max-w-xl text-sm text-gray-400 leading-7 space-y-3">
                  <p>
                    We’re building the next layer of video control with Kling, including lipsync,
                    motion reference, and more advanced creative tools.
                  </p>
                  <p>Stay tuned for updates.</p>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
};

export default StudioApp;
