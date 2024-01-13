import { setLoaded } from 'ambagi/loading';
import { setupTooltips } from 'ambagi/tooltips';
import { setupVideos } from 'ambagi/videos';

setupVideos();
setupTooltips();
setTimeout(setLoaded, 1000);