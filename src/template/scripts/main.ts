import { setLoaded } from 'ambagi/loading';
import { setupVideos } from 'ambagi/videos';

setupVideos();
setTimeout(setLoaded, 1000);