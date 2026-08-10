// Approximate real-world (not ARAI-lab) mileage ranges for common Indian
// vehicles, used to auto-suggest a starting number for the trip cost
// estimator - hosts can always override it. Not exhaustive; unmatched
// vehicles fall back to a generic per-vehicle-type default.
const VEHICLE_MILEAGE_TABLE = [
  // Hatchbacks / small cars
  { keys: ['alto'], min: 20, max: 22, fuelType: 'Petrol' },
  { keys: ['wagon r', 'wagonr'], min: 19, max: 21, fuelType: 'Petrol' },
  { keys: ['swift'], min: 18, max: 21, fuelType: 'Petrol' },
  { keys: ['baleno'], min: 19, max: 22, fuelType: 'Petrol' },
  { keys: ['celerio'], min: 21, max: 23, fuelType: 'Petrol' },
  { keys: ['tiago'], min: 19, max: 21, fuelType: 'Petrol' },
  { keys: ['punch'], min: 18, max: 20, fuelType: 'Petrol' },
  { keys: ['grand i10', 'i10'], min: 18, max: 20, fuelType: 'Petrol' },
  { keys: ['i20'], min: 17, max: 20, fuelType: 'Petrol' },
  { keys: ['kwid'], min: 21, max: 23, fuelType: 'Petrol' },
  { keys: ['santro'], min: 18, max: 20, fuelType: 'Petrol' },

  // Sedans
  { keys: ['dzire', 'swift dzire'], min: 20, max: 22, fuelType: 'Petrol' },
  { keys: ['amaze'], min: 14, max: 17, fuelType: 'Petrol' },
  { keys: ['city'], min: 15, max: 17, fuelType: 'Petrol' },
  { keys: ['verna'], min: 16, max: 18, fuelType: 'Petrol' },
  { keys: ['ciaz'], min: 17, max: 19, fuelType: 'Petrol' },
  { keys: ['vento'], min: 15, max: 17, fuelType: 'Petrol' },

  // Compact SUVs / crossovers
  { keys: ['venue'], min: 17, max: 19, fuelType: 'Petrol' },
  { keys: ['brezza'], min: 17, max: 19, fuelType: 'Petrol' },
  { keys: ['nexon'], min: 16, max: 18, fuelType: 'Petrol' },
  { keys: ['xuv300', 'xuv 300'], min: 16, max: 18, fuelType: 'Petrol' },
  { keys: ['sonet'], min: 17, max: 19, fuelType: 'Petrol' },
  { keys: ['wr-v', 'wrv'], min: 15, max: 16, fuelType: 'Petrol' },
  { keys: ['ecosport'], min: 15, max: 17, fuelType: 'Petrol' },

  // Mid/full-size SUVs & MPVs (commonly diesel)
  { keys: ['creta'], min: 15, max: 17, fuelType: 'Diesel' },
  { keys: ['seltos'], min: 18, max: 20, fuelType: 'Diesel' },
  { keys: ['ertiga'], min: 17, max: 19, fuelType: 'Petrol' },
  { keys: ['xuv700', 'xuv 700'], min: 13, max: 15, fuelType: 'Diesel' },
  { keys: ['scorpio'], min: 12, max: 14, fuelType: 'Diesel' },
  { keys: ['thar'], min: 12, max: 14, fuelType: 'Diesel' },
  { keys: ['innova'], min: 10, max: 13, fuelType: 'Diesel' },
  { keys: ['fortuner'], min: 8, max: 10, fuelType: 'Diesel' },
  { keys: ['harrier'], min: 13, max: 15, fuelType: 'Diesel' },
  { keys: ['safari'], min: 13, max: 15, fuelType: 'Diesel' },

  // Two-wheelers
  { keys: ['splendor'], min: 60, max: 68, fuelType: 'Petrol' },
  { keys: ['hf deluxe'], min: 65, max: 70, fuelType: 'Petrol' },
  { keys: ['passion'], min: 55, max: 62, fuelType: 'Petrol' },
  { keys: ['shine'], min: 55, max: 60, fuelType: 'Petrol' },
  { keys: ['activa'], min: 45, max: 50, fuelType: 'Petrol' },
  { keys: ['access'], min: 45, max: 48, fuelType: 'Petrol' },
  { keys: ['jupiter'], min: 45, max: 48, fuelType: 'Petrol' },
  { keys: ['pulsar'], min: 38, max: 45, fuelType: 'Petrol' },
  { keys: ['apache'], min: 40, max: 45, fuelType: 'Petrol' },
  { keys: ['fz'], min: 42, max: 46, fuelType: 'Petrol' },
  { keys: ['classic 350', 'classic350'], min: 30, max: 35, fuelType: 'Petrol' },
  { keys: ['himalayan'], min: 28, max: 32, fuelType: 'Petrol' },
  { keys: ['duke'], min: 30, max: 35, fuelType: 'Petrol' },
];

// Fallback when the model text doesn't match anything above.
const GENERIC_DEFAULTS = {
  Bike: { kmpl: 45, min: 40, max: 50, fuelType: 'Petrol' },
  Car: { kmpl: 17, min: 15, max: 19, fuelType: 'Petrol' },
  Bus: { kmpl: 6, min: 5, max: 7, fuelType: 'Diesel' },
  Mixed: { kmpl: 17, min: 15, max: 19, fuelType: 'Petrol' },
};

// suggestMileage("Honda Amaze 2018", "Car") -> { kmpl: 15, min: 14, max: 17, fuelType: 'Petrol', matched: true }
export function suggestMileage(vehicleModel, vehicleType) {
  const norm = (vehicleModel || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (norm) {
    const hit = VEHICLE_MILEAGE_TABLE.find((entry) => entry.keys.some((k) => norm.includes(k)));
    if (hit) {
      return { kmpl: Math.round((hit.min + hit.max) / 2), min: hit.min, max: hit.max, fuelType: hit.fuelType, matched: true };
    }
  }

  return { ...(GENERIC_DEFAULTS[vehicleType] || GENERIC_DEFAULTS.Car), matched: false };
}

// Best-effort mileage suggestion for a host planning a trip, preferring
// their own registered numbers over a guess:
//   1. A saved vehicle (Dashboard > My Vehicles) matching this trip's
//      vehicle type with a mileage the host entered themselves - exact.
//   2. Fuzzy match on their legacy profile vehicle model name - approximate.
//   3. A generic per-vehicle-type default - a rough starting point.
export function suggestMileageForUser(user, vehicleType) {
  const ownVehicle = (user?.vehicles || []).find((v) => v.vehicleType === vehicleType && v.mileageKmpl > 0);
  if (ownVehicle) {
    return { kmpl: ownVehicle.mileageKmpl, fuelType: ownVehicle.fuelType || 'Petrol', matched: true, source: 'vehicle' };
  }
  return { ...suggestMileage(user?.vehicleModel, vehicleType), source: 'guess' };
}
