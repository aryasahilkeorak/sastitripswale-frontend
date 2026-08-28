import enIN from './en-IN.js';
import hiIN from './hi-IN.js';
import bnIN from './bn-IN.js';
import mrIN from './mr-IN.js';
import teIN from './te-IN.js';
import taIN from './ta-IN.js';
import guIN from './gu-IN.js';
import urIN from './ur-IN.js';
import knIN from './kn-IN.js';
import orIN from './or-IN.js';
import mlIN from './ml-IN.js';
import paIN from './pa-IN.js';

const BASE = {
  'en-IN': enIN,
  'hi-IN': hiIN,
  'bn-IN': bnIN,
  'mr-IN': mrIN,
  'te-IN': teIN,
  'ta-IN': taIN,
  'gu-IN': guIN,
  'ur-IN': urIN,
  'kn-IN': knIN,
  'or-IN': orIN,
  'ml-IN': mlIN,
  'pa-IN': paIN,
};

// Per-page translation modules live in ./pages/*.js - each exports one
// object keyed by language code so a page's strings can be authored (and
// reviewed) independently of every other page's, then merged in here.
// Add new page modules to this list as they're translated.
import componentsCards from './pages/components-cards.js';
import componentsMisc from './pages/components-misc.js';
import content from './pages/content.js';

const PAGE_MODULES = [componentsCards, componentsMisc, content];

const LANGUAGE_CODES = Object.keys(BASE);

function merge() {
  const result = {};
  for (const code of LANGUAGE_CODES) {
    result[code] = PAGE_MODULES.reduce((acc, mod) => Object.assign(acc, mod[code] || {}), { ...BASE[code] });
  }
  return result;
}

export const translations = merge();
