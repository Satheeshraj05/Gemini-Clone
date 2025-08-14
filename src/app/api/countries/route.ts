import { NextResponse } from 'next/server';

// Revalidate every 24 hours
export const revalidate = 86400; // 24 hours in seconds

export async function GET() {
  try {
    // Fetch countries from REST Countries API
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    
    const countries = await response.json();
    
    // Transform the data to match our CountryOption interface
    const formattedCountries = countries.map((country: any) => {
      const iddRoot = country.idd?.root || '';
      const iddSuffixes = country.idd?.suffixes?.[0] || '';
      const dialCode = iddRoot + iddSuffixes;
      
      // Get flag emoji from country code
      const codePoints = country.cca2
        .toUpperCase()
        .split('')
        .map((char: string) => 127397 + char.charCodeAt(0));
      
      return {
        code: country.cca2,
        name: country.name.common,
        dial_code: dialCode,
        emoji: String.fromCodePoint(...codePoints),
        flag: country.flags.png,
      };
    })
    // Filter out countries without dial codes
    .filter((country: any) => country.dial_code)
    // Sort by country name
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    return NextResponse.json(formattedCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
