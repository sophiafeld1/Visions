function initLandingHeroVideo() {
  const video = document.getElementById("landing-hero-video");
  if (!video) return;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  };

  video.addEventListener("loadeddata", tryPlay, { once: true });
  video.addEventListener("canplay", tryPlay, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryPlay();
    }
  });

  window.addEventListener("pageshow", tryPlay);

  document.addEventListener(
    "touchstart",
    () => {
      tryPlay();
    },
    { once: true, capture: true }
  );

  video.load();
  tryPlay();
}

initLandingHeroVideo();
