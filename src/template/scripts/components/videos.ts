const videoPendingDataKey = 'playPending';
const videoShouldPlayDataKey = 'shouldPlay';

let intersectionObserver: IntersectionObserver | null = null;

function updateVideoState(video: HTMLVideoElement): void {
  const isPending = video.dataset[videoPendingDataKey] === true.toString();
  if (isPending) {
    console.log('Skipping');
    return;
  }
  const shouldPlay = video.dataset[videoShouldPlayDataKey] === true.toString();
  const isPlaying = !video.paused;
  if (shouldPlay !== isPlaying) {
    if (shouldPlay) {
      video.dataset[videoPendingDataKey] = true.toString();
      void video.play().then(() => {
        video.dataset[videoPendingDataKey] = false.toString();
        updateVideoState(video);
      });
    }
    else {
      video.pause();
    }
  }
}

function setVideoState(video: HTMLVideoElement, playing: boolean): void {
  video.dataset[videoShouldPlayDataKey] = playing.toString();
  updateVideoState(video);
}

function setupAutoplay(root: HTMLElement): void {
  if (!window.IntersectionObserver) {
    return;
  }
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('video[autoplay]')) as readonly HTMLVideoElement[];
  intersectionObserver ??= new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement;
      setVideoState(video, entry.isIntersecting);
    });
  });
  intersectionObserver.disconnect();
  for (const video of videos) {
    video.dataset[videoPendingDataKey] = false.toString();
    video.dataset[videoShouldPlayDataKey] = false.toString();
    setVideoState(video, false);
    intersectionObserver.observe(video);
  }
}

export function setupVideoLoading(video: HTMLVideoElement): void {
  const parent = video.parentElement;
  if (!parent || !parent.classList.contains('video-holder')) {
    return;
  }
  video.addEventListener('canplay', () => {
    parent.classList.add('can-play');
  });
  if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
    parent.classList.remove('can-play');
  } else {
    parent.classList.add('can-play');
  }
}

export function setupVideos(root: HTMLElement): void {
  Array.from(root.getElementsByTagName('video')).forEach(setupVideoLoading);
  setupAutoplay(root);
}