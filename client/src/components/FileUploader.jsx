import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function FileUploader({ onTextExtracted }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size allowed is 10MB.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/parse-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text from the file.");
      }

      const ext = file.name.split('.').pop().toLowerCase();
      let typeCategory = 'typed';
      if (ext === 'pdf') typeCategory = 'pdf';
      else if (ext === 'docx' || ext === 'doc') typeCategory = 'docx';
      else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) typeCategory = 'image';

      setSuccessMsg(`Successfully extracted text from ${file.name}`);
      onTextExtracted(data.text, file.name, typeCategory);
      
      // Auto clear success message after 4s
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while parsing the file.");
    } finally {
      setIsLoading(false);
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-[#CA8A04] bg-[#CA8A04]/10 scale-[0.98]'
            : 'border-[#CA8A04]/40 bg-white/5 hover:border-[#CA8A04] hover:bg-white/10'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.docx,.doc,.txt,image/*"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-[#CA8A04] animate-spin" />
            <p className="text-sm font-medium text-slate-300">Extracting content and performing OCR...</p>
            <p className="text-xs text-slate-500">This may take up to a minute for large files or images</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-2.5 rounded-full bg-[#44403C]/40 border border-[#CA8A04]/20 text-[#CA8A04] transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                <span className="text-[#CA8A04] font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, Word (.docx), Images (OCR), or Text Files (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Notifications */}
      {error && (
        <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Parsing Error:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="font-medium">
            {successMsg}
          </div>
        </div>
      )}
    </div>
  );
}
