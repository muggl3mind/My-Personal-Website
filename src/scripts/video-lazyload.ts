/**
 * IntersectionObserver-based swap from poster <img> to autoplay <video>.
 * Respects prefers-reduced-motion (skips the swap entirely).
 */

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

if (!prefersReducedMotion) {
  const posters = document.querySelectorAll<HTMLImageElement>('[data-video-poster]');

  if (posters.length > 0 && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const poster = entry.target as HTMLImageElement;
          const src = poster.dataset.videoSrc;
          if (!src) continue;

          const video = document.createElement('video');
          video.src = src;
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.preload = 'auto';
          video.poster = poster.src;
          video.className = poster.className;
          video.setAttribute('aria-hidden', 'true');
          video.style.opacity = '0';
          video.style.transition = 'opacity 500ms ease-out';

          poster.parentElement?.appendChild(video);

          video.addEventListener(
            'playing',
            () => {
              video.style.opacity = '1';
              // Fade out the poster after the video is actually playing.
              poster.style.transition = 'opacity 500ms ease-out';
              poster.style.opacity = '0';
            },
            { once: true },
          );

          io.unobserve(poster);
        }
      },
      { rootMargin: '200px' },
    );

    posters.forEach((p) => io.observe(p));
  }
}
