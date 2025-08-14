'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Loader2, Check } from 'lucide-react';
import { fetchCountries, getDefaultCountry, type CountryOption } from '@/services/country-service';

// Remove any jf-ext-* attributes that might be added by browser extensions
const cleanAttributes = (node: Element | null) => {
  if (!node) return;
  
  // Remove jf-ext-* attributes
  const attributes = Array.from(node.attributes);
  for (const attr of attributes) {
    if (attr.name.startsWith('jf-ext-')) {
      node.removeAttribute(attr.name);
    }
  }
  
  // Process child nodes
  const children = Array.from(node.children);
  children.forEach(child => cleanAttributes(child));
};

// This ensures the component is only rendered on the client side
const ClientSidePhoneInput = dynamic(
  () => Promise.resolve((props: any) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
      // Clean any jf-ext-* attributes from the DOM after mount
      const timer = setTimeout(() => {
        cleanAttributes(document.documentElement);
      }, 0);
      
      return () => clearTimeout(timer);
    }, []);
    
    if (!mounted) {
      // Return a simplified version for SSR
      return (
        <div className={cn('flex rounded-md border border-input bg-background', props.className)}>
          <div className="h-10 w-24 animate-pulse bg-muted rounded-l-md"></div>
          <Input 
            type="tel"
            placeholder="Phone number"
            className="flex-1 border-0 bg-transparent rounded-l-none"
            disabled={props.disabled}
          />
        </div>
      );
    }
    
    return <PhoneInput {...props} />;
  }), 
  { 
    ssr: false,
    loading: () => (
      <div className={cn('flex rounded-md border border-input bg-background')}>
        <div className="h-10 w-24 animate-pulse bg-muted rounded-l-md"></div>
        <div className="flex-1 border-0 bg-transparent rounded-l-none h-10 animate-pulse"></div>
      </div>
    )
  }
);

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountrySelect?: (country: CountryOption) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  defaultCountry?: string; // ISO 3166-1 alpha-2 country code (e.g., 'US')
}

export const PhoneInput = ({
  value = '', // Ensure value is never undefined
  onChange,
  onCountrySelect,
  disabled = false,
  className = '',
  inputClassName = '',
  buttonClassName = '',
  defaultCountry = 'US',
}: PhoneInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(getDefaultCountry());
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load countries on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCountries = async () => {
      try {
        setIsLoading(true);
        const countriesData = await fetchCountries();
        
        if (!isMounted) return;
        
        setCountries(countriesData);
        
        // Only set default country if we haven't selected one yet
        if (!selectedCountry) {
          const defaultCountryData = defaultCountry 
            ? countriesData.find(c => c.code === defaultCountry.toUpperCase()) 
            : getDefaultCountry();
            
          if (defaultCountryData) {
            setSelectedCountry(defaultCountryData);
            if (onCountrySelect) {
              onCountrySelect(defaultCountryData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        // Fallback to default country if there's an error
        if (!isMounted) return;
        
        const fallbackCountry = getDefaultCountry();
        setCountries([fallbackCountry]);
        setSelectedCountry(fallbackCountry);
        if (onCountrySelect) {
          onCountrySelect(fallbackCountry);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Only load countries if we haven't loaded them yet
    if (countries.length === 0) {
      loadCountries();
    }
    
    return () => {
      isMounted = false;
    };
  }, [defaultCountry, onCountrySelect, selectedCountry, countries.length]);
  
  // Filter countries based on search query
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dial_code.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = useCallback((country: CountryOption) => {
    setSelectedCountry(country);
    if (onCountrySelect) {
      onCountrySelect(country);
    }
    setIsOpen(false);
    // Focus the phone input after selecting a country
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [onCountrySelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, spaces, and dashes
    const newValue = e.target.value.replace(/[^0-9\s-]/g, '');
    // Ensure onChange is called with the new value
    if (onChange) {
      onChange(newValue);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{0,3})(\d{0,4})$/);
    return match ? `(${match[1]}) ${match[2] ? match[2] : ''}${match[3] ? `-${match[3]}` : ''}`.trim() : phone;
  };

  // Ensure value is always a string to prevent undefined/controlled warnings
  const safeValue = value || '';
  const displayValue = formatPhoneNumber(safeValue);

  // Client-side only rendering is now handled by the dynamic import

  // Create a stable ID for the input to prevent hydration mismatches
  const inputId = React.useId();

  return (
    <div className={cn('flex rounded-md border border-input bg-background', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-10 rounded-r-none border-r px-3 text-sm font-normal',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              disabled && 'opacity-50',
              buttonClassName
            )}
            disabled={disabled || isLoading}
            suppressHydrationWarning
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="mr-2">{selectedCountry.emoji}</span>
                <span>{selectedCountry.dial_code}</span>
              </>
            )}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              <ul className="divide-y">
                {filteredCountries.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center px-4 py-2 text-left text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:outline-none focus:bg-accent',
                        selectedCountry.code === country.code && 'bg-accent/50'
                      )}
                      onClick={() => handleCountrySelect(country)}
                    >
                      <span className="mr-3 text-lg">{country.emoji}</span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className="text-muted-foreground">{country.dial_code}</span>
                      {selectedCountry.code === country.code && (
                        <Check className="ml-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        ref={inputRef}
        type="tel"
        placeholder="Phone number"
        className={cn(
          'flex-1 border-0 bg-transparent focus-visible:ring-0',
          'rounded-l-none',
          disabled && 'opacity-50',
          inputClassName
        )}
        value={displayValue || ''} // Ensure value is always a string
        onChange={handleInputChange}
        disabled={disabled}
        suppressHydrationWarning
        id={inputId}
        key={`input-${inputId}`}
      />
    </div>
  );
};
