import { addFontsReadyListener } from 'ambagi/components/fontLoading';
import { setLoaded } from 'ambagi/components/loading';
import { setupTooltips } from 'ambagi/components/tooltips';
import { setupVideos } from 'ambagi/components/videos';

setupVideos();
setupTooltips();
addFontsReadyListener(setLoaded);