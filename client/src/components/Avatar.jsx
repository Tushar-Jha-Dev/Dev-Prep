import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * DevPrep - Reusable User Avatar Component (`Avatar.jsx`)
 * Conforms to Design.md & User Guidelines:
 * - Displays the cropped profile photo if present; falls back to initials circle.
 * - Sizing controlled via `size` prop in pixels (default 38px).
 * - Fixed width & height, 1px `--border` ring, `object-fit: cover`, circular 50% radius.
 * - Image loading placeholder prevents initials flash on mount.
 * - Graceful fallback to initials if image URL fails to load.
 */
export default function Avatar({
  user,
  size = 38,
  src,
  className = '',
  style = {}
}) {
  const auth = useAuth();
  const contextAvatar = auth?.avatar;
  const avatarLoading = auth?.avatarLoading;

  // Use explicit src if provided, otherwise context avatar
  const activePhoto = src !== undefined ? src : contextAvatar;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Compute initials from user name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0] ? parts[0].slice(0, 2) : 'U').toUpperCase();
  };

  const initials = getInitials(user?.name);
  const fontSize = Math.max(11, Math.round(size * 0.38));

  const baseStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    ...style
  };

  // If avatar is currently in initial auth hydration, show clean shimmer placeholder
  if (avatarLoading && !activePhoto) {
    return (
      <div
        className={`avatar-placeholder-shimmer ${className}`}
        style={baseStyle}
        aria-hidden="true"
      />
    );
  }

  // If photo is present and hasn't errored
  if (activePhoto && !imageError) {
    return (
      <div
        className={`avatar-wrapper ${className}`}
        style={baseStyle}
      >
        <img
          src={activePhoto}
          alt={user?.name ? `${user.name}'s profile photo` : 'User profile photo'}
          className={`avatar-image ${imageLoaded ? 'avatar-loaded' : 'avatar-loading'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          decoding="async"
        />
        {!imageLoaded && (
          <div
            className="avatar-placeholder-shimmer avatar-placeholder-overlay"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // Fallback: Initials circular badge
  return (
    <div
      className={`avatar-initials-badge ${className}`}
      style={{
        ...baseStyle,
        fontSize: `${fontSize}px`
      }}
      aria-label={user?.name ? `${user.name}` : 'User avatar'}
      title={user?.name || 'User'}
    >
      <span className="avatar-initials-text font-fraunces">{initials}</span>
    </div>
  );
}
