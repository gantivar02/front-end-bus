import { useEffect, useRef, useState } from "react";

export default function PhotoUploader({ photos = [], onChange, max = 5 }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const canAdd = photos.length < max;

  const handleFiles = (fileList) => {
    const remaining = max - photos.length;
    const incoming = Array.from(fileList).slice(0, remaining);
    onChange?.([...photos, ...incoming]);
  };

  const handleRemove = (idx) => {
    onChange?.(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {photos.map((file, idx) => (
          <div
            key={`${file.name}-${idx}`}
            className="relative aspect-square rounded-xl overflow-hidden border border-neg-outline-variant group"
          >
            <img
              src={previews[idx]}
              alt={file.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-neg-error text-neg-on-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Quitar foto"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-neg-outline-variant flex flex-col items-center justify-center gap-1 text-neg-on-surface-variant hover:border-neg-primary hover:text-neg-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[28px]">
              add_a_photo
            </span>
            <span className="text-xs font-semibold">Subir foto</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-neg-on-surface-variant">
        Hasta {max} imágenes (JPG/PNG). {photos.length}/{max}
      </p>
    </div>
  );
}
