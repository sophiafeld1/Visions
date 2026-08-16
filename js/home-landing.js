function initLandingHeroVideo() {
  const video = document.getElementById("landing-hero-video");
  if (!video) return;

  video.load();
  video.play().catch(() => {});
}

initLandingHeroVideo();
