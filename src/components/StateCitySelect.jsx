import CustomSelect from './CustomSelect.jsx';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '../lib/indiaStatesDistricts.js';

// Paired State + City(district) dropdowns - City's options are the selected
// state's districts, so picking a new state clears any city that no longer
// applies. Renders just the two bare .form-group fields (no wrapping grid
// of its own) so callers can lay them out however fits - side by side in a
// standalone .form-row, or as two cells of a larger field-grid-3.
export default function StateCitySelect({
  state, city, onStateChange, onCityChange, required = false,
  stateLabel = 'State', cityLabel = 'City', disabled = false,
}) {
  const districts = DISTRICTS_BY_STATE[state] || [];

  return (
    <>
      <div className="form-group">
        <label>{stateLabel}{required && ' *'}</label>
        <CustomSelect
          value={state}
          onChange={(e) => {
            onStateChange(e.target.value);
            if (city) onCityChange('');
          }}
          options={[{ value: '', label: 'Select state' }, ...INDIAN_STATES]}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label>{cityLabel}{required && ' *'}</label>
        <CustomSelect
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          options={[{ value: '', label: state ? 'Select city' : 'Select state first' }, ...districts]}
          disabled={disabled || !state}
        />
      </div>
    </>
  );
}
