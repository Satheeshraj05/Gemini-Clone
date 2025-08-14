interface Country {
  name: string;
  cca2: string;
  idd: {
    root: string;
    suffixes: string[];
  };
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
}

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2 code (e.g., 'US')
  name: string; // Country name
  dial_code: string; // Country calling code (e.g., '+1')
  emoji: string; // Country flag emoji
  flag: string; // URL to flag image
}

// Cache for country data
let countriesCache: CountryOption[] | null = null;

/**
 * Fetches country data from the REST Countries API
 */
export async function fetchCountries(): Promise<CountryOption[]> {
  // Return cached data if available
  if (countriesCache) {
    return countriesCache;
  }

  try {
    // First, try to fetch from our API route
    const response = await fetch('/api/countries');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries from API route');
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      countriesCache = data;
      return data;
    }
    
    throw new Error('No country data received from API route');
  } catch (error) {
    console.error('Error fetching countries from API route, falling back to static data:', error);
    
    // Fallback to static data if API fails
    return getStaticCountryData();
  }
}

/**
 * Gets a country by its ISO 3166-1 alpha-2 code
 */
export async function getCountryByCode(code: string): Promise<CountryOption | undefined> {
  const countries = await fetchCountries();
  return countries.find(country => country.code === code.toUpperCase());
}

/**
 * Gets a country by its dial code
 */
export async function getCountryByDialCode(dialCode: string): Promise<CountryOption | undefined> {
  const countries = await fetchCountries();
  return countries.find(country => country.dial_code === dialCode);
}

/**
 * Gets the default country (US)
 */
export function getDefaultCountry(): CountryOption {
  return {
    code: 'US',
    name: 'United States',
    dial_code: '+1',
    emoji: '🇺🇸',
    flag: 'https://flagcdn.com/w40/us.png',
  };
}

/**
 * Static country data as a fallback
 */
function getStaticCountryData(): CountryOption[] {
  // This is a small subset of countries for the fallback
  // In a real app, you might want to include more countries
  return [
    {
      code: 'US',
      name: 'United States',
      dial_code: '+1',
      emoji: '🇺🇸',
      flag: 'https://flagcdn.com/w40/us.png',
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      dial_code: '+44',
      emoji: '🇬🇧',
      flag: 'https://flagcdn.com/w40/gb.png',
    },
    {
      code: 'CA',
      name: 'Canada',
      dial_code: '+1',
      emoji: '🇨🇦',
      flag: 'https://flagcdn.com/w40/ca.png',
    },
    {
      code: 'AU',
      name: 'Australia',
      dial_code: '+61',
      emoji: '🇦🇺',
      flag: 'https://flagcdn.com/w40/au.png',
    },
    {
      code: 'IN',
      name: 'India',
      dial_code: '+91',
      emoji: '🇮🇳',
      flag: 'https://flagcdn.com/w40/in.png',
    },
  ];
}
