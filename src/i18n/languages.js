// The major regional Indian languages, shown in Settings for the user to
// pick from. English (India) is the default so nothing changes for anyone
// who never opens the language setting.
export const LANGUAGES = [
  { code: 'en-IN', englishName: 'English', nativeName: 'English' },
  { code: 'hi-IN', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn-IN', englishName: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr-IN', englishName: 'Marathi', nativeName: 'मराठी' },
  { code: 'te-IN', englishName: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta-IN', englishName: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu-IN', englishName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur-IN', englishName: 'Urdu', nativeName: 'اردو' },
  { code: 'kn-IN', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or-IN', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml-IN', englishName: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa-IN', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export const DEFAULT_LANGUAGE = 'en-IN';

// Urdu is written right-to-left - everything else here uses a left-to-right script.
export const RTL_LANGUAGES = ['ur-IN'];
