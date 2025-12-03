"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HiPhone } from "react-icons/hi2"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  onCountryCodeChange: (code: string) => void
  placeholder?: string
  className?: string
  error?: string
}

const countryCodes = [
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
]

export function PhoneInput({ 
  value, 
  onChange, 
  countryCode, 
  onCountryCodeChange, 
  placeholder = "Enter phone number",
  className = "",
  error
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, spaces, and hyphens
    const phoneValue = e.target.value.replace(/[^\d\s\-]/g, '')
    onChange(phoneValue)
  }

  const selectedCountry = countryCodes.find(country => country.code === countryCode)

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /> */}
        
        <div className="flex">
          {/* Country Code Selector */}
          <Select value={countryCode} onValueChange={onCountryCodeChange}>
            <SelectTrigger className={`w-36 h-12 rounded-l-full border-r-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex items-center py-0 ${isFocused ? 'border-blue-500' : ''}`}>
              <SelectValue>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-base">{selectedCountry?.flag}</span>
                  <span className="text-xs font-medium truncate">{selectedCountry?.code}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {countryCodes.map((country) => (
                <SelectItem key={country.code} value={country.code} className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{country.flag}</span>
                    <span className="text-sm">{country.code}</span>
                    <span className="text-xs text-gray-500 truncate">{country.country}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Phone Number Input */}
          <Input
            type="tel"
            placeholder={placeholder}
            value={value}
            onChange={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`pl-10 h-12 rounded-r-full border-l-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1 ${isFocused ? 'border-blue-500' : ''} ${className}`}
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
