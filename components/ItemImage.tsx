'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { QrCode, X } from 'lucide-react';

interface ItemImageProps {
  src?: string | null;
  alt: string;
  size?: number; // width & height in px, default 36
  className?: string;
  allowZoom?: boolean;
}

export default function ItemImage({
  src,
  alt,
  size = 36,
  className = '',
  allowZoom = true,
}: ItemImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '6px',
          flexShrink: 0,
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
        }}
        title={alt}
      >
        <QrCode size={Math.round(size * 0.45)} color="var(--text-muted)" />
      </div>
    );
  }

  // Check if src is an optimized remote domain supported by next/image
  const isSupabase = src.includes('.supabase.co') || src.includes('lh3.googleusercontent.com');

  return (
    <>
      <div
        className={`item-image-container ${className}`}
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '6px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          cursor: allowZoom ? 'zoom-in' : 'default',
        }}
        onClick={(e) => {
          if (allowZoom) {
            e.stopPropagation();
            setIsModalOpen(true);
          }
        }}
        title={allowZoom ? `Klik untuk memperbesar foto: ${alt}` : alt}
      >
        {/* Placeholder skeleton while loading */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, var(--bg-tertiary) 0%, rgba(255,255,255,0.06) 50%, var(--bg-tertiary) 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-pulse 1.5s infinite ease-in-out',
            }}
          />
        )}

        {isSupabase ? (
          <Image
            src={src}
            alt={alt}
            width={size * 2} // 2x for retina sharpness
            height={size * 2}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {allowZoom && isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-primary)',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  maxWidth: '300px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {alt}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm btn-icon"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1rem',
                maxHeight: 'calc(90vh - 60px)',
                overflow: 'auto',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                loading="eager"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
