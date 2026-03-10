import React, { useCallback, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploaderProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onChange: (files: File[]) => void;
  required?: boolean;
  description?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  accept = "image/*",
  multiple = false,
  maxFiles = 1,
  onChange,
  required = false,
  description
}) => {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.slice(0, maxFiles - previews.length);

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviews(prev => {
      const updated = multiple ? [...prev, ...newPreviews] : newPreviews;
      // Notify parent
      onChange(updated.map(p => p.file));
      return updated;
    });
  }, [maxFiles, multiple, onChange, previews.length]);

  const removeFile = (index: number) => {
    setPreviews(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      onChange(updated.map(p => p.file));
      return updated;
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="block text-sm font-medium text-gray-200">
          {label} {required && <span className="text-primary">*</span>}
        </label>
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer group",
          isDragging ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5",
          previews.length > 0 && !multiple ? "hidden" : "block"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={previews.length >= maxFiles}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-full bg-surface group-hover:bg-secondary transition-colors">
            <Upload className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
          <div className="text-sm text-gray-400">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-gray-600">
            {multiple ? `Max ${maxFiles} files` : 'Single file'} (JPG, PNG)
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className={clsx("grid gap-4", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10 bg-surface aspect-video">
              <img
                src={preview.url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-xs text-white truncate px-3">
                {preview.file.name}
              </div>
            </div>
          ))}
          {multiple && previews.length < maxFiles && (
             <div
             onClick={() => document.getElementById(`add-more-${label}`)?.click()}
             className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg aspect-video cursor-pointer hover:bg-white/5 transition-colors"
           >
             <input
                id={`add-more-${label}`}
                type="file"
                className="hidden"
                accept={accept}
                multiple
                onChange={(e) => handleFiles(e.target.files)}
             />
             <ImageIcon className="w-6 h-6 text-gray-500 mb-2" />
             <span className="text-xs text-gray-500">Add more</span>
           </div>
          )}
        </div>
      )}
    </div>
  );
};