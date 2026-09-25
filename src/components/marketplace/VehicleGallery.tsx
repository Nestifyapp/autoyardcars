'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import type { VehicleImage } from '@/lib/domain/types';
import { useState } from 'react';

export function VehicleGallery({ title, images }: { title: string; images: VehicleImage[] }) {
  const [activeId, setActiveId] = useState(images[0]?.id);
  const active = images.find(image => image.id === activeId) ?? images[0];

  if (!active) {
    return (
      <div className="overflow-hidden rounded-card border border-line bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 shadow-lg">
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-white/80">
          <Camera className="h-10 w-10 text-amber-300" aria-hidden />
          <span className="text-sm">Vehicle photos coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-slate-900 shadow-lg">
        <Image src={active.variants?.full ?? active.url} alt={active.alt ?? title} fill priority sizes="(max-width: 768px) 100vw, 65vw" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent px-3 pb-3 pt-12">
        <div className="flex gap-2 overflow-x-auto" aria-label="Vehicle photo gallery">
        {images.map(image => (
          <button key={image.id} type="button" onClick={() => setActiveId(image.id)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition sm:h-16 sm:w-24 ${image.id === active.id ? 'border-amber-400 ring-2 ring-amber-200' : 'border-white/40 hover:border-white'}`} aria-label={`Show ${image.alt ?? title}`}>
            <Image src={image.variants?.thumb ?? image.url} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
