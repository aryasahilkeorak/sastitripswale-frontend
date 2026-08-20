// Brand → model catalog for the "Add a vehicle" form's dropdowns. Covers
// the mainstream brands/models actually on Indian roads (including several
// recently-discontinued ones still common secondhand) - not literally every
// variant ever sold. Anything not listed is covered by the "Other" option
// every list ends with, which the form swaps for a free-text input.
const CATALOG = {
  Car: {
    'Maruti Suzuki': ['Alto', 'S-Presso', 'WagonR', 'Celerio', 'Swift', 'Baleno', 'Dzire', 'Ignis', 'Ciaz', 'Ertiga', 'XL6', 'Brezza', 'Grand Vitara', 'Fronx', 'Jimny', 'Eeco'],
    Hyundai: ['Eon', 'Santro', 'Grand i10 Nios', 'i20', 'Aura', 'Venue', 'Verna', 'Creta', 'Alcazar', 'Tucson', 'Exter'],
    Tata: ['Nano', 'Tiago', 'Tigor', 'Altroz', 'Punch', 'Nexon', 'Harrier', 'Safari'],
    Mahindra: ['KUV100', 'Bolero', 'Bolero Neo', 'XUV300', 'XUV400', 'Scorpio', 'Scorpio-N', 'XUV700', 'Thar', 'Marazzo'],
    Honda: ['Amaze', 'City', 'WR-V', 'Jazz', 'Elevate'],
    Toyota: ['Glanza', 'Urban Cruiser', 'Etios', 'Innova Crysta', 'Innova Hycross', 'Fortuner', 'Camry', 'Rumion'],
    Kia: ['Sonet', 'Seltos', 'Carens', 'EV6'],
    Renault: ['Kwid', 'Triber', 'Kiger', 'Duster'],
    Nissan: ['Magnite', 'Micra', 'Sunny', 'Terrano'],
    Volkswagen: ['Polo', 'Vento', 'Taigun', 'Virtus'],
    Skoda: ['Rapid', 'Kushaq', 'Slavia', 'Octavia', 'Superb'],
    MG: ['Astor', 'Hector', 'ZS EV', 'Comet', 'Gloster'],
    Ford: ['Figo', 'Aspire', 'EcoSport', 'Endeavour'],
    Chevrolet: ['Beat', 'Spark', 'Cruze', 'Enjoy'],
    Jeep: ['Compass', 'Meridian'],
    Citroen: ['C3', 'C5 Aircross', 'eC3'],
    Fiat: ['Punto', 'Linea'],
    Datsun: ['GO', 'GO+', 'redi-GO'],
    // Indian brands
    'Force Motors': ['Gurkha', 'Trax'],
    'Hindustan Motors': ['Ambassador'],
    ICML: ['Rhino RX'],
  },
  Bike: {
    // Indian brands
    Hero: ['Splendor', 'HF Deluxe', 'Passion', 'Glamour', 'Super Splendor', 'Xtreme', 'Xpulse', 'Destini', 'Pleasure'],
    Bajaj: ['Platina', 'CT100', 'Pulsar', 'Avenger', 'Dominar', 'Chetak'],
    TVS: ['Sport', 'Star City', 'Jupiter', 'Ntorq', 'Apache', 'Raider', 'iQube'],
    'Royal Enfield': ['Bullet 350', 'Classic 350', 'Meteor 350', 'Hunter 350', 'Himalayan', 'Continental GT'],
    Jawa: ['Jawa 42', 'Perak'],
    Yezdi: ['Adventure', 'Roadster', 'Scrambler'],
    Ather: ['450X', '450S', 'Rizta'],
    'Ola Electric': ['S1', 'S1 Pro', 'S1 Air', 'S1 X'],
    Okinawa: ['PraisePro', 'R30'],
    // Other brands sold in India
    Honda: ['Activa', 'Dio', 'Shine', 'Unicorn', 'SP125', 'Hornet', 'CB350', 'CBR150R'],
    Yamaha: ['Fascino', 'RayZR', 'FZ', 'R15', 'MT-15'],
    Suzuki: ['Access', 'Burgman', 'Gixxer', 'Avenis'],
    KTM: ['Duke 125', 'Duke 200', 'Duke 390', 'RC 200', 'RC 390'],
    Kawasaki: ['Ninja 300', 'Ninja 650', 'Z650'],
    Aprilia: ['SR 160', 'RS 457'],
  },
  Bus: {
    Tata: ['Starbus', 'Winger', 'Magic'],
    'Ashok Leyland': ['Viking', 'Lynx', 'Cheetah'],
    'Force Motors': ['Traveller'],
    Mahindra: ['Cruzio', 'Tourister'],
    Volvo: ['9400', 'B7R'],
  },
  Other: {},
};

const OTHER = '+ Add Custom';

export function getBrandsForType(vehicleType) {
  const brands = Object.keys(CATALOG[vehicleType] || {});
  return [...brands.sort(), OTHER];
}

export function getModelsForBrand(vehicleType, brand) {
  const models = CATALOG[vehicleType]?.[brand];
  if (!models) return [OTHER];
  return [...models, OTHER];
}

export const OTHER_OPTION = OTHER;

// 2001 -> current year, newest first (matches how people mentally scan a
// vehicle-year dropdown - most vehicles being registered are recent ones).
export function getVehicleYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current; y >= 2001; y--) years.push(y);
  return years;
}
