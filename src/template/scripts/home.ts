import { addFontsReadyListener } from 'ambagi/components/fontLoading';
import { setLoaded } from 'ambagi/components/loading';

addFontsReadyListener(setLoaded);