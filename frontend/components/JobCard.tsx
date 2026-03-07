import React, { useEffect, useState } from 'react';
import { Job, GenerateResponse } from '../types';
import { getJobStatus } from '../services/api';
import { Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, FileJson, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';

interface JobCardProps {
  job: Job;
  onUpdate: (updatedJob: Job) => void;
  token: string;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onUpdate, token }) => {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setError(null);
      const data = await getJobStatus(job.jobId, token);
      
      // Map API response status to our internal status if needed, 
      // assuming API returns 'COMPLETED', 'FAILED', 'PROCESSING', 'PENDING'
      const newStatus = data.status as Job['status'];
      
      const updatedJob: Job = {
        ...job,
        status: newStatus,
        resultUrl: data.resultUrl || job.resultUrl,
        metadataJsonUrl: data.metadataJsonUrl || job.metadataJsonUrl
      };
      
      onUpdate(updatedJob);
      return newStatus;
    } catch (err: any) {
      setError(err.message);
      return job.status;
    }
  };

  useEffect(() => {
    let intervalId: number;

    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      setIsPolling(true);
      intervalId = window.setInterval(async () => {
        const status = await checkStatus();
        if (status === 'COMPLETED' || status === 'FAILED') {
          setIsPolling(false);
          clearInterval(intervalId);
        }
      }, 5000); // Poll every 5 seconds
    } else {
      setIsPolling(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status, job.jobId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 border-green-500/20 bg-green-500/10';
      case 'FAILED': return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'PROCESSING': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      default: return 'text-gray-400 border-gray-500/20 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5" />;
      case 'FAILED': return <XCircle className="w-5 h-5" />;
      case 'PROCESSING': return <Loader2 className="w-5 h-5 animate-spin" />;
      default: return <Loader2 className="w-5 h-5 opacity-50" />;
    }
  };

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(job.status)}`}>
              {getStatusIcon(job.status)}
              {job.status}
            </span>
            <span className="text-xs text-gray-500 font-mono">ID: {job.jobId.slice(0, 8)}...</span>
          </div>
          <h3 className="font-medium text-white line-clamp-1" title={job.prompt}>
            {job.prompt}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(job.createdAt).toLocaleTimeString()} • {job.toolType.replace('_', ' ')}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkStatus} 
          disabled={isPolling}
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10">
          Error: {error}
        </div>
      )}

      {job.resultUrl && job.status === 'COMPLETED' && (
        <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-black/20">
          {job.toolType === 'VIDEO_VEO' || job.resultUrl.endsWith('.mp4') ? (
            <video 
              src={job.resultUrl} 
              controls 
              className="w-full aspect-video object-contain" 
              poster={job.resultUrl.replace('.mp4', '.png')} // Fallback if backend generates poster
            />
          ) : (
            <img 
              src={job.resultUrl} 
              alt="Result" 
              className="w-full h-auto object-contain max-h-[300px]" 
            />
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {job.resultUrl && (
          <a 
            href={job.resultUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            {job.toolType === 'VIDEO_VEO' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            View Media
          </a>
        )}
        {job.metadataJsonUrl && (
          <a 
            href={job.metadataJsonUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-colors"
            title="View Metadata"
          >
            <FileJson className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};