'use client';
import * as React from 'react';
import { Upload, FileCheck, Loader2 } from 'lucide-react';

const FileUploadComponent: React.FC = () => {
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'done'>('idle');
  const [fileName, setFileName] = React.useState<string>('');

  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
    el.addEventListener('change', async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0);
        if (file) {
          setFileName(file.name);
          setStatus('uploading');

          const formData = new FormData();
          formData.append('pdf', file);

          try {
            await fetch('http://localhost:8000/upload/pdf', {
              method: 'POST',
              body: formData,
            });
            setStatus('done');
            setTimeout(() => setStatus('idle'), 3000);
          } catch {
            setStatus('idle');
          }
        }
      }
    });
    el.click();
  };

  return (
    <div
      onClick={handleFileUploadButtonClick}
      className="group w-full cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/5 hover:bg-white/10 hover:border-violet-500/40 transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 text-center"
    >
      {status === 'idle' && (
        <>
          <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-violet-500/5">
            <Upload className="size-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Upload PDF</h3>
            <p className="text-xs text-muted-foreground">Click to select a file (max 10MB)</p>
          </div>
        </>
      )}

      {status === 'uploading' && (
        <>
          <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Loader2 className="size-6 text-amber-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Uploading…</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-in zoom-in duration-300">
            <FileCheck className="size-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-1">Uploaded!</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUploadComponent;
