import { addFontsReadyListener } from 'ambagi/components/fontLoading';
import { setLoaded } from 'ambagi/components/loading';
import { setupNavigation } from 'ambagi/components/navigation';
//import { setupTooltips } from 'ambagi/components/tooltips';
import { setupVideos } from 'ambagi/components/videos';

setupNavigation();
setupVideos();
//setupTooltips();
addFontsReadyListener(setLoaded);
