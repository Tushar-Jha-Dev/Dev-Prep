import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Check } from 'lucide-react';
import Modal from './Modal';

const CANVAS_SIZE = 280; // Displayed preview square in pixels
const TARGET_EXPORT_SIZE = 256; // Final uploaded image dimensions (256x256)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * DevPrep - Profile Photo Crop & Resize Modal (`CropModal.jsx`)
 * Conforms to Design.md & User Guidelines:
 * - Pure HTML5 Canvas crop and resize without any third-party libraries.
 * - Re-encodes as 256x256 WebP (with JPEG fallback) to strip EXIF metadata (GPS, etc.).
 * - Client-side validation: format (JPG/PNG/WebP), size <= 5 MB, >= 64x64, <= 8000x8000.
 * - Interactive circular guide stencil, drag to reposition, zoom slider, keyboard navigation.
 */
export default function CropModal({
  isOpen,
  onClose,
  onPhotoCropped,
  initialFile = null
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialFile) {
        handleFileValidationAndLoad(initialFile);
      } else {
        setSelectedFile(null);
        setImageObj(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setError(null);
      }
    } else {
      setSelectedFile(null);
      setImageObj(null);
      setError(null);
    }
  }, [isOpen, initialFile]);

  // Client-side file validation & image decoding
  const handleFileValidationAndLoad = (file) => {
    setError(null);

    if (!file) return;

    // 1. MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        setError('SVG images are not supported for profile photos. Please choose a JPG, PNG, or WebP image.');
        return;
      }
      if (file.type === 'image/gif' || file.name.endsWith('.gif')) {
        setError('GIF images are not supported for profile photos. Please choose a JPG, PNG, or WebP image.');
        return;
      }
      setError('Please choose a JPG, PNG, or WebP image.');
      return;
    }

    // 2. File size validation (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB limit. Please select a smaller photo.');
      return;
    }

    // 3. Load image to check dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Dimension bounds check
        if (img.naturalWidth < 64 || img.naturalHeight < 64) {
          setError('Image resolution is too low (minimum 64x64 pixels). Please choose a higher quality photo.');
          return;
        }
        if (img.naturalWidth > 8000 || img.naturalHeight > 8000) {
          setError('Image dimensions exceed the 8000x8000 limit to prevent browser memory issues. Please choose a smaller photo.');
          return;
        }

        setSelectedFile(file);
        setImageObj(img);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setError(null);
      };
      img.onerror = () => {
        setError('Failed to load image. The file may be corrupted.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setError('Failed to read file from disk.');
    };
    reader.readAsDataURL(file);
  };

  // Draw image and circular stencil overlay to canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 16; // Circular guide radius

    ctx.clearRect(0, 0, width, height);

    // Calculate base cover scale
    const scaleFactor = Math.max(
      (radius * 2) / imageObj.naturalWidth,
      (radius * 2) / imageObj.naturalHeight
    );
    const effectiveScale = scaleFactor * zoom;

    const drawW = imageObj.naturalWidth * effectiveScale;
    const drawH = imageObj.naturalHeight * effectiveScale;

    // Draw image centered + user pan offset
    const drawX = centerX - drawW / 2 + pan.x;
    const drawY = centerY - drawH / 2 + pan.y;

    ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);

    // Draw circular stencil guide: dark semi-transparent overlay outside the circle
    ctx.save();
    ctx.fillStyle = 'rgba(15, 14, 12, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true); // Cut out circular viewport
    ctx.fill();

    // Subtle guideline border around the circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [imageObj, zoom, pan]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (!imageObj) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch pan handlers for mobile screens
  const handleTouchStart = (e) => {
    if (!imageObj || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Keyboard navigation on preview container
  const handleKeyDown = (e) => {
    if (!imageObj) return;
    const STEP = 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x - STEP }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPan((p) => ({ ...p, x: p.x + STEP }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y - STEP }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPan((p) => ({ ...p, y: p.y + STEP }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)));
    }
  };

  // Export cropped 256x256 WebP/JPEG data URL
  const handleConfirmCrop = async () => {
    if (!imageObj || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      const radius = CANVAS_SIZE / 2 - 16;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = TARGET_EXPORT_SIZE;
      exportCanvas.height = TARGET_EXPORT_SIZE;
      const expCtx = exportCanvas.getContext('2d');

      // Ratio between export resolution (256) and display diameter (radius * 2)
      const exportRatio = TARGET_EXPORT_SIZE / (radius * 2);

      const scaleFactor = Math.max(
        (radius * 2) / imageObj.naturalWidth,
        (radius * 2) / imageObj.naturalHeight
      );
      const effectiveScale = scaleFactor * zoom * exportRatio;

      const drawW = imageObj.naturalWidth * effectiveScale;
      const drawH = imageObj.naturalHeight * effectiveScale;

      const drawX = TARGET_EXPORT_SIZE / 2 - drawW / 2 + (pan.x * exportRatio);
      const drawY = TARGET_EXPORT_SIZE / 2 - drawH / 2 + (pan.y * exportRatio);

      // Render image onto offscreen canvas
      expCtx.drawImage(imageObj, drawX, drawY, drawW, drawH);

      // Re-encode through canvas to strip EXIF and produce compact WebP or JPEG
      let dataUrl = exportCanvas.toDataURL('image/webp', 0.85);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = exportCanvas.toDataURL('image/jpeg', 0.85);
      }

      await onPhotoCropped(dataUrl);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process and upload cropped photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const customFooter = (
    <div className="crop-modal-footer">
      <div className="crop-modal-footer-note">
        <span>Photo updates immediately across the application</span>
      </div>
      <div className="crop-modal-footer-actions">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirmCrop}
          className="btn btn-primary"
          disabled={!imageObj || isProcessing}
        >
          {isProcessing ? 'Saving photo...' : 'Use this photo'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Profile Photo"
      footer={customFooter}
      maxWidth="480px"
    >
      <div className="crop-modal-body">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileValidationAndLoad(e.target.files[0]);
            }
          }}
        />

        {error && (
          <div className="error-card crop-error-banner" role="alert">
            <div className="error-content">
              <AlertCircle size={18} className="error-icon" aria-hidden="true" />
              <span className="error-text">{error}</span>
            </div>
          </div>
        )}

        {imageObj ? (
          <div className="crop-editor-layout">
            <div
              className="crop-canvas-wrapper"
              tabIndex={0}
              role="region"
              aria-label="Photo crop preview area. Use arrow keys to adjust pan, and slider below to zoom."
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="crop-preview-canvas"
              />
              <span className="crop-pan-hint">Drag or use arrow keys to position</span>
            </div>

            {/* Zoom Slider Control */}
            <div className="crop-zoom-control">
              <ZoomOut size={16} className="zoom-icon" aria-hidden="true" />
              <input
                id="crop-zoom-slider"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                aria-label="Image zoom level"
                className="crop-zoom-slider"
              />
              <ZoomIn size={16} className="zoom-icon" aria-hidden="true" />
              <button
                type="button"
                className="btn btn-secondary btn-sm crop-reset-btn"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                title="Reset crop alignment"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm choose-different-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              <span>Choose a different photo</span>
            </button>
          </div>
        ) : (
          <div
            className="crop-upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="dropzone-icon-box">
              <Upload size={28} aria-hidden="true" />
            </div>
            <p className="dropzone-primary-text">Click to browse or drop an image</p>
            <p className="dropzone-sub-text">Supported formats: JPG, PNG, or WebP up to 5 MB</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
