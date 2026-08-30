import React, { useEffect, useState } from 'react';

const robotImageSrc = '/images/robot.jpg';

interface AIRobotProps {
  className?: string;
}

export const AIRobot: React.FC<AIRobotProps> = ({ className = "w-28 h-32 sm:w-32 sm:h-36 md:w-36 md:h-40" }) => {
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [leftX, setLeftX] = useState<number>(-100);
  const [rightX, setRightX] = useState<number>(-45);

  // Calculate dynamic DOM position bounds for safe two-sided spacing
  const calculateBounds = () => {
    try {
      const nameEl = document.getElementById('dashboard-welcome-name');
      const cardEl = document.getElementById('dashboard-readiness-card');
      const robotEl = document.getElementById('dashboard-robot-container');

      if (nameEl && robotEl) {
        const nameRect = nameEl.getBoundingClientRect();
        const robotRect = robotEl.getBoundingClientRect();

        // Safe left boundary: 45px visual gap after the end of user's profile name
        const calculatedLeft = (nameRect.right - robotRect.left) + 45;
        if (calculatedLeft < 0) {
          setLeftX(Math.max(-340, Math.min(-30, calculatedLeft)));
        }
      }

      if (cardEl && robotEl) {
        const cardRect = cardEl.getBoundingClientRect();
        const robotRect = robotEl.getBoundingClientRect();

        // Safe right boundary: 45px visual gap before the left edge of 84% readiness card
        const calculatedRight = (cardRect.left - robotRect.right) - 45;
        setRightX(Math.min(10, Math.max(-80, calculatedRight)));
      }
    } catch (e) {
      console.warn('Error calculating robot bounds:', e);
    }
  };

  useEffect(() => {
    calculateBounds();
    const timer = setTimeout(calculateBounds, 300);
    window.addEventListener('resize', calculateBounds);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateBounds);
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = robotImageSrc;
    img.onerror = (err) => {
      console.warn('Robot image canvas load fallback notice:', err);
    };
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Remove ONLY dark space background pixels, preserving full uploaded robot design
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const maxC = Math.max(r, g, b);
            const sumC = r + g + b;

            const isOuterBorder = x < width * 0.015 || x > width * 0.985 || y < height * 0.015 || y > height * 0.985;

            if (isOuterBorder && maxC < 75) {
              data[i + 3] = 0;
            } else if (maxC < 42 || sumC < 110) {
              data[i + 3] = 0;
            } else if (maxC < 75) {
              const alpha = (maxC - 42) / (75 - 42);
              data[i + 3] = Math.floor(alpha * 255);
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedDataUrl(canvas.toDataURL('image/png'));
      } catch (canvasErr) {
        console.warn('Canvas processing notice:', canvasErr);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{
        ['--robot-left-x' as string]: `${leftX}px`,
        ['--robot-right-x' as string]: `${rightX}px`,
      }}
    >
      <style>{`
        /* Dynamic Path Sequence bounded by 45px safe gaps on both left and right sides */
        @keyframes robotDynamicPathSequence {
          0%, 100% {
            /* Right safe stop: 45px gap before 84% readiness card, facing forward */
            transform: translate3d(var(--robot-right-x, -45px), 0px, 0px) rotate(0deg);
          }
          15% {
            /* Turn Left toward user's name safe bound */
            transform: translate3d(calc(var(--robot-left-x, -100px) * 0.4), -2px, 0px) rotate(-12deg);
          }
          35% {
            /* Reach left safe stop: 45px gap after user's name */
            transform: translate3d(var(--robot-left-x, -100px), -3px, 0px) rotate(-10deg);
          }
          42%, 52% {
            /* Stop/Pause at left safe stop, face forward */
            transform: translate3d(var(--robot-left-x, -100px), 0px, 0px) rotate(0deg);
          }
          68% {
            /* Turn Right toward right safe stop */
            transform: translate3d(calc((var(--robot-left-x, -100px) + var(--robot-right-x, -45px)) * 0.45), 2px, 0px) rotate(12deg);
          }
          85%, 93% {
            /* Stop/Pause cleanly at right safe stop (45px gap before 84% card), face forward */
            transform: translate3d(var(--robot-right-x, -45px), 0px, 0px) rotate(0deg);
          }
        }

        .robot-dynamic-path-container {
          animation: robotDynamicPathSequence 7.5s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* Robot Container with Two-Sided Safe Spacing Traversal Animation */}
      <div className="relative w-full h-full flex items-center justify-center robot-dynamic-path-container">
        <img
          src={processedDataUrl || robotImageSrc}
          alt="AceHire AI Robot Assistant"
          className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
        />
      </div>
    </div>
  );
};

export default AIRobot;
