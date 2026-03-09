import React, {useEffect, useState, useCallback,  useRef} from 'react';
import {
  ToolType,
  Lighting,
  MotionStyle,
  DesignGoal,
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

// --- HELPER: Safe LocalStorage ---
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

const App: React.FC = () => {
  // --- STATE INITIALIZATION (Load from Storage) ---
  
  // 1. App Config
  const [mode, setMode] = useState<ToolType>(() => loadState("ugc8s_mode", ToolType.VIDEO_VEO));
  const [useMock, setUseMock] = useState(() => loadState("ugc8s_use_mock", false));
  const [apiToken, setApiToken] = useState(() => {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem("ugc8s_api_token") || "";
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [section, setSection] = useState<AppSection>(() => loadState("ugc8s_section", "studio"));

  // 2. Job History
  const [jobs, setJobs] = useState<Job[]>(() => {
    const loaded = loadState<Job[]>("ugc8s_jobs", []);
    return Array.isArray(loaded) ? loaded : [];
  });

  // --- Polling refs (avoid stale closures) ---
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
    };
  }, []);

  const refreshJob = useCallback(async (jobId: string) => {
    const token = tokenRef.current;
    if (!token) return;

    try {
      const server = await getJob(jobId, token);
      setJobs((prev) => prev.map((j) => (j.jobId === jobId ? mergeServerJob(j, server) : j)));
    } catch (e) {
      console.warn("refreshJob failed", e);
    }
  }, [mergeServerJob]);

  // Auto-poll running/queued jobs (Veo can take minutes)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const token = tokenRef.current;
      if (!token) return;

      const pending = jobsRef.current.filter((j) => j.status === "running" || j.status === "queued");
      if (!pending.length) return;

      // Limit per tick to avoid flooding backend
      pending.slice(0, 3).forEach((j) => {
        refreshJob(j.jobId);
      });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [refreshJob]);



  // 3. Form Inputs
  const [prompt, setPrompt] = useState(() => loadState("ugc8s_prompt", ""));
  const [negativePrompt, setNegativePrompt] = useState(() => loadState("ugc8s_negativePrompt", ""));
  const [styleLock, setStyleLock] = useState(() => loadState("ugc8s_styleLock", true));
  const [lighting, setLighting] = useState<Lighting>(() => loadState("ugc8s_lighting", Lighting.STUDIO_SOFTBOX));
  const [motionStyle, setMotionStyle] = useState<MotionStyle>(() => loadState("ugc8s_motionStyle", MotionStyle.NORMAL));
  const [designGoal, setDesignGoal] = useState<DesignGoal>(() => loadState("ugc8s_designGoal", DesignGoal.POSTER));
  const [aspectRatio, setAspectRatio] = useState(() => loadState("ugc8s_aspectRatio", "16:9"));
  const [resolution, setResolution] = useState(() => loadState("ugc8s_resolution", "720p"));
  const [durationSeconds, setDurationSeconds] = useState(() => loadState("ugc8s_durationSeconds", "8"));
  const [promptGen, setPromptGen] = useState(DEFAULT_PROMPT_GENERATOR_STATE);

  // 4. Files (Cannot be persisted due to browser security)
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [startFrame, setStartFrame] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  // --- PERSISTENCE LOGIC ---

  // Helper to save and update UI
  const persist = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Save failed", e);
    }
  }, []);

  // Auto-save Effects
  useEffect(() => persist("ugc8s_mode", mode), [mode, persist]);
  useEffect(() => persist("ugc8s_section", section), [section, persist]);
  useEffect(() => persist("ugc8s_use_mock", useMock), [useMock, persist]);
  useEffect(() => persist("ugc8s_prompt", prompt), [prompt, persist]);
  useEffect(() => persist("ugc8s_negativePrompt", negativePrompt), [negativePrompt, persist]);
  useEffect(() => persist("ugc8s_styleLock", styleLock), [styleLock, persist]);
  useEffect(() => persist("ugc8s_lighting", lighting), [lighting, persist]);
  useEffect(() => persist("ugc8s_motionStyle", motionStyle), [motionStyle, persist]);
  useEffect(() => persist("ugc8s_designGoal", designGoal), [designGoal, persist]);
  
  useEffect(() => {
    persist("ugc8s_jobs", jobs.slice(0, 50)); // Limit history size
  }, [jobs, persist]);

  useEffect(() => {
    if (apiToken) {
      localStorage.setItem("ugc8s_api_token", apiToken);
      setLastSavedTime(new Date().toLocaleTimeString());
    }
  }, [apiToken]);

  // Manual Checkpoint
  const saveCheckpoint = () => {
    // Force save all current states
    persist("ugc8s_mode", mode);
    persist("ugc8s_use_mock", useMock);
    persist("ugc8s_prompt", prompt);
    persist("ugc8s_jobs", jobs);
    // ... others are handled by effects, but this gives user feedback
    alert(`Checkpoint Saved at ${new Date().toLocaleTimeString()}!\n\nNote: Images cannot be saved due to browser security.`);
  };

  const clearHistory = () => {
    if (window.confirm("Hapus semua history job?")) {
      setJobs([]);
      localStorage.removeItem("ugc8s_jobs");
    }
  };

  // --- API HELPERS ---

  const mapStatus = (s: any): any => {
    const v = String(s || "");
    if (v === "queued" || v === "running" || v === "succeeded" || v === "failed") return v;
    if (v === "PENDING") return "queued";
    if (v === "PROCESSING") return "running";
    if (v === "COMPLETED") return "succeeded";
    if (v === "FAILED") return "failed";
    return "queued";
  };

  const guessMime = (name: string) => {
    const s = (name || "").toLowerCase();
    if (s.endsWith(".png")) return "image/png";
    if (s.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiToken) {
      alert("API Token belum diisi. Isi dulu token (ugc8s-demo-123).");
      setShowTokenInput(true);
      return;
    }

    const trimmedPrompt = prompt.trim();
    const trimmedNegativePrompt = negativePrompt.trim();
    const finalPrompt = trimmedNegativePrompt
      ? `${trimmedPrompt}\n\nAvoid / Negative:\n${trimmedNegativePrompt}`
      : trimmedPrompt;

    if (!trimmedPrompt) {
      alert("Prompt wajib diisi.");
      return;
    }

    if (!useMock && mode === ToolType.IMAGE_NANO && !heroImage) {
      alert("Hero Image wajib diisi untuk Image Mode saat Mock mode OFF!");
      return;
    }

    setIsSubmitting(true);

    try {
      const clientJobId = `job_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

      let heroImageGcsPath: string | null = null;
      const referenceImageGcsPaths: string[] = [];
      let startFrameGcsPath: string | null = null;
      let endFrameGcsPath: string | null = null;

      if (!useMock) {
        if (heroImage) heroImageGcsPath = await uploadToGcs(heroImage, clientJobId, 'hero');

        for (const f of referenceImages.slice(0, 3)) {
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
        formData.append('motionStyle', motionStyle);
        formData.append('aspectRatio', aspectRatio);
        formData.append('resolution', resolution);
        formData.append('durationSeconds', String(durationSeconds));
      } else {
        formData.append('designGoal', designGoal);
      }

      formData.append('mock', useMock ? 'true' : 'false');

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
        metadataJsonUrl: response.metadataJsonUrl
      };

      setJobs(prev => [newJob, ...prev]);
      setTimeout(() => refreshJob(newJob.jobId), 1500);
    } catch (error) {
      console.error(error);
      alert("Failed to start generation job. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.jobId === updatedJob.jobId ? updatedJob : j));
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 8, right: 12, fontSize: 12, opacity: 0.7, zIndex: 9999, textAlign: 'right' }}>
        <div className="font-mono text-xs text-gray-400">v2026-03-06-05 (Verified Persistence)</div>
        {lastSavedTime && (
          <div className="text-green-400 text-[10px] flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Saved: {lastSavedTime}
          </div>
        )}
      </div>

      <div className="flex h-screen overflow-hidden bg-background text-white">
        {/* Sidebar / Navigation */}
        <aside className="w-64 border-r border-white/10 bg-surface flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white">
                <Zap className="w-5 h-5" fill="currentColor" />
              </div>
              UGC8s
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Creative Studio</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                setSection("studio");
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
                setSection("studio");
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
              onClick={() => setSection("kling")}
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

        {/* Main Content */}
        {section === 'studio' ? (
        <main className="flex-1 flex overflow-hidden">
          {/* Input Panel */}
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
                {/* Prompt */}
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
                  <label className="block text-sm font-medium text-gray-200">
                    Negative Prompt
                  </label>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder={mode === ToolType.VIDEO_VEO ? "What to avoid in the generated video..." : "What to avoid in the generated image..."}
                    className="w-full h-24 bg-surface border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    Isi negative prompt akan otomatis ditambahkan saat proses generate.
                  </p>
                </div>

                <PromptGeneratorPanel
                  value={promptGen}
                  onChange={setPromptGen}
                  currentPrompt={prompt}
                  onInsert={setPrompt}
                  onReset={() => setPromptGen(DEFAULT_PROMPT_GENERATOR_STATE)}
                />

                {/* Hero Image */}
                <FileUploader
                  label={mode === ToolType.VIDEO_VEO ? "Hero Image (Optional)" : "Hero Image"}
                  required={!useMock && mode === ToolType.IMAGE_NANO}
                  onChange={(files) => setHeroImage(files[0] || null)}
                  description={
                    mode === ToolType.VIDEO_VEO
                      ? "Optional. Bisa dikosongkan untuk text-to-video."
                      : "The main subject or style reference."
                  }
                />

                {/* Reference Images */}
                <FileUploader
                  label="Reference Images"
                  multiple
                  maxFiles={3}
                  onChange={setReferenceImages}
                  description="Up to 3 additional images for context."
                />

                {/* Video Frames */}
                {mode === ToolType.VIDEO_VEO && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploader
                      label="Start Frame (Optional)"
                      onChange={(files) => setStartFrame(files[0] || null)}
                    />
                    <FileUploader
                      label="End Frame (Optional)"
                      onChange={(files) => setEndFrame(files[0] || null)}
                    />
                  </div>
                )}

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Style Lock */}
                  <div className="space-y-2">
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

                 {/* Video Specific Controls */}
{mode === ToolType.VIDEO_VEO && (
  <>
    <div className="space-y-2 md:col-span-2">
      <label className="block text-sm font-medium text-gray-200">Video Style</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.values(MotionStyle).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => setMotionStyle(style)}
            className={`px-3 py-2 rounded-lg text-sm border transition-all ${
              motionStyle === style
                ? "bg-white text-black border-white font-medium"
                : "bg-surface border-white/10 text-gray-400 hover:border-white/30"
            }`}
          >
            {style.charAt(0).toUpperCase() + style.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 md:col-span-2">
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
  </>
)}

                  {/* Image Specific Controls */}
                  {mode === ToolType.IMAGE_NANO && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-200">Design Goal</label>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.values(DesignGoal).map((goal) => (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => setDesignGoal(goal)}
                            className={`px-4 py-3 rounded-lg text-sm border text-left transition-all ${
                              designGoal === goal
                                ? 'bg-white text-black border-white font-medium'
                                : 'bg-surface border-white/10 text-gray-400 hover:border-white/30'
                            }`}
                          >
                            {goal.replace('_', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mock mode toggle */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-white">Mock mode</div>
                      <div className="text-xs text-gray-400">
                        ON: finalize dummy (testing). OFF: upload input ke GCS + generate.
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useMock}
                        onChange={(e) => setUseMock(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-gray-200">{useMock ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                </div>

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

          {/* Results Panel */}
          <div className="w-96 bg-secondary/30 border-l border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-sm">
              <h2 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Job History
              </h2>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                {jobs.length}
              </span>
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
                jobs.map((job) => (
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
        )}      </div>
    </>
  );
};

export default App;
