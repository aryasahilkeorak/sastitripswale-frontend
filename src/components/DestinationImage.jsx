import { useEffect, useState } from 'react';
import { imageUrl, DESTINATION_PLACEHOLDER } from '../lib/helpers.js';
import { destinationPhoto } from '../lib/wikiPhoto.js';

// Drop-in replacement for `<img src={imageUrl(trip.coverImageUrl, someFallback)} />`
// across the trip cards/pages: if the organizer never uploaded a cover photo,
// this resolves a real photo of the destination (via Wikipedia) instead of an
// unrelated random stock image. Any extra props (className, style, loading…)
// pass straight through to the <img>.
export default function DestinationImage({ trip, alt, ...imgProps }) {
  const [fallback, setFallback] = useState(DESTINATION_PLACEHOLDER);

  useEffect(() => {
    if (trip?.coverImageUrl) return undefined;
    let active = true;
    setFallback(DESTINATION_PLACEHOLDER);
    destinationPhoto(trip?.destination).then((url) => {
      if (active && url) setFallback(url);
    });
    return () => {
      active = false;
    };
  }, [trip?.coverImageUrl, trip?.destination]);

  return <img src={imageUrl(trip?.coverImageUrl, fallback)} alt={alt ?? trip?.destination} {...imgProps} />;
}
