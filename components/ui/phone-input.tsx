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
  // Africa
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+225", country: "Ivory Coast", flag: "🇨🇮" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+239", country: "São Tomé & Príncipe", flag: "🇸🇹" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "DR Congo", flag: "🇨🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+268", country: "Eswatini", flag: "🇸🇿" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  // Americas
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1-CA", country: "Canada", flag: "🇨🇦" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+501", country: "Belize", flag: "🇧🇿" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panama", flag: "🇵🇦" },
  { code: "+509", country: "Haiti", flag: "🇭🇹" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  // Asia & Pacific
  { code: "+7", country: "Russia / Kazakhstan", flag: "🇷🇺" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+960", country: "Maldives", flag: "🇲🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+967", country: "Yemen", flag: "🇾🇪" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+970", country: "Palestine", flag: "🇵🇸" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+975", country: "Bhutan", flag: "🇧🇹" },
  { code: "+976", country: "Mongolia", flag: "🇲🇳" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
  { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  // Europe
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+356", country: "Malta", flag: "🇲🇹" },
  { code: "+357", country: "Cyprus", flag: "🇨🇾" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },
  { code: "+377", country: "Monaco", flag: "🇲🇨" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+387", country: "Bosnia & Herzegovina", flag: "🇧🇦" },
  { code: "+389", country: "North Macedonia", flag: "🇲🇰" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
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
    const phoneValue = e.target.value.replace(/[^\d\s\-]/g, '')
    onChange(phoneValue)
  }

  const selectedCountry = countryCodes.find(country => country.code === countryCode)

  return (
    <div className="space-y-2">
      {/* Unified pill-shaped container */}
      <div
        className={`flex h-12 rounded-full overflow-hidden border transition-all duration-200 ${
          isFocused
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : error
              ? 'border-red-400'
              : 'border-gray-300'
        }`}
      >
        {/* Country Code Selector */}
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger
            className="w-[110px] h-full shrink-0 rounded-none border-0 border-r border-gray-200 shadow-none focus:ring-0 focus:ring-offset-0 bg-gray-50 px-3 hover:bg-gray-100 transition-colors"
          >
            <SelectValue>
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{selectedCountry?.flag ?? "🌐"}</span>
                <span className="text-xs font-medium text-gray-700 truncate">{selectedCountry?.code ?? countryCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            {countryCodes.map((country) => (
              <SelectItem key={`${country.code}-${country.country}`} value={country.code} className="py-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{country.flag}</span>
                  <span className="text-sm font-medium text-gray-800">{country.code}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[120px]">{country.country}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <div className="relative flex-1 flex items-center">
          <HiPhone className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
          <Input
            type="tel"
            placeholder={placeholder}
            value={value}
            onChange={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-full w-full rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-9 pr-4 bg-white ${className}`}
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
