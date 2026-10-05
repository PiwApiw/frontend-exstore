'use client';

import React, { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

interface ImageCompressorProps {
  onImageCompressed?: (result: CompressedImageResult) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  label?: string;
  className?: string;
}

export function ImageCompressor({
  onImageCompressed,
  onError,
  maxSizeMB = 0.5, // 500KB maximum per requirements
  maxWidthOrHeight = 1920,
  label = 'Pilih atau seret gambar ke sini',
  className = '',
}: ImageCompressorProps) {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Format file harus berupa gambar (JPEG, PNG, WebP).';
        onError?.(errorMsg);
        return;
      }

      setIsCompressing(true);
      setProgress(10);

      try {
        const originalSize = file.size;

        const options = {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker: true,
          onProgress: (currentProgress: number) => {
            setProgress(currentProgress);
          },
        };

        const compressedBlob = await imageCompression(file, options);
        const compressedFile = new File([compressedBlob], file.name, {
          type: compressedBlob.type || file.type,
          lastModified: Date.now(),
        });

        const compressedSize = compressedFile.size;
        const savingsPercent = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        );

        const previewUrl = URL.createObjectURL(compressedFile);
        setPreview(previewUrl);
        setStats({
          originalSize: formatFileSize(originalSize),
          compressedSize: formatFileSize(compressedSize),
          savedPercent: savingsPercent,
        });

        onImageCompressed?.({
          file: compressedFile,
          previewUrl,
          originalSize,
          compressedSize,
          savingsPercent,
        });
      } catch (err: any) {
        console.error('Image compression failed:', err);
        const message = err?.message || 'Gagal mengompresi gambar.';
        onError?.(message);
      } finally {
        setIsCompressing(false);
        setProgress(100);
      }
    },
    [maxSizeMB, maxWidthOrHeight, onImageCompressed, onError]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {stats && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="line-through">{stats.originalSize}</span>
                <span>→</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats.compressedSize}
                </span>
                {stats.savedPercent > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium px-1.5 py-0.5 rounded">
                    -{stats.savedPercent}%
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">Klik untuk mengganti gambar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </p>
            <p className="text-xs text-slate-500">
              Maks. {maxSizeMB * 1024} KB (otomatis dikompresi di browser)
            </p>
          </div>
        )}

        {isCompressing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Mengompresi gambar... {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default ImageCompressor;
