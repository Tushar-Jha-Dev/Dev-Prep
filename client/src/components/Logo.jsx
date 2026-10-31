import React from 'react';

/**
 * DevPrep Reusable Logo Component (`Logo.jsx`)
 * Conforms to Design.md & Branding requirements:
 * - Displays the authentic DevPrep logo (`/logo.png`)
 * - Props: `size` (number, default 32), `showWordmark` (boolean, default false)
 * - Sets explicit width & height attributes on <img> to prevent CLS
 * - alt="DevPrep", decoding="async"
 * - In light theme: transparent background, renders on the page surface
 * - In dark theme: renders inside a cream tile (`--logo-tile`, #F4EFE6) with 10px radius
 *   and padding scaling proportionally (~6px at 32px), with no shadows or glows
 * - Wordmark renders in Young Serif (`--font-heading`)
 */
export default function Logo({
  size = 32,
  showWordmark = false,
  className = '',
  wordmarkClassName = '',
  ...props
}) {
  // Original logo dimensions: 1312 x 1199 (~1.09425 : 1)
  const imgHeight = Math.round(size);
  const imgWidth = Math.round(size * (1312 / 1199));
  
  // Padding for dark theme tile scales proportionally (~6px at 32px size)
  const tilePad = Math.max(3, Math.round(size * 0.16));
  
  // Wordmark font size scales proportionally with the mark
  const wordmarkFontSize = Math.round(size * 0.68);

  return (
    <div
      className={`devprep-logo ${className}`.trim()}
      style={{ '--tile-pad': `${tilePad}px` }}
      {...props}
    >
      <div className="logo-tile">
        <img
          src="/logo.png"
          alt="DevPrep"
          width={imgWidth}
          height={imgHeight}
          decoding="async"
          className="logo-img"
          style={{ width: `${imgWidth}px`, height: `${imgHeight}px` }}
        />
      </div>

      {showWordmark && (
        <span
          className={`logo-wordmark ${wordmarkClassName}`.trim()}
          style={{ fontSize: `${wordmarkFontSize}px` }}
        >
          DevPrep<span className="brand-dot">.</span>
        </span>
      )}
    </div>
  );
}
