import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import allWorldCountries from 'world-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
// Build a full, comprehensive country list with dial codes
const toFlagEmoji = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

const isoToName = Object.fromEntries(
  allWorldCountries.map((c) => [c.cca2.toUpperCase(), c.name.common])
) as Record<string, string>;

const phoneCodes = new Set(getCountries());
const countries = allWorldCountries
  .map((c) => {
    const cc = c.cca2.toUpperCase();
    let dial = '';
    if (phoneCodes.has(cc as CountryCode)) {
      try {
        dial = `+${getCountryCallingCode(cc as CountryCode)}`;
      } catch {
        dial = '';
      }
    }
    return {
      code: cc,
      name: isoToName[cc] || cc,
      flag: toFlagEmoji(cc),
      dialCode: dial,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export const CountrySelector = ({ value, onValueChange, placeholder = "Select country" }: CountrySelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const selectedCountry = countries.find(country => country.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 px-3"
        >
          {selectedCountry ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="truncate">{selectedCountry.name}</span>
              <span className="text-muted-foreground ml-auto">{selectedCountry.dialCode}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.dialCode}`}
                  onSelect={() => {
                    onValueChange?.(country.code);
                    setOpen(false);
                  }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { countries };