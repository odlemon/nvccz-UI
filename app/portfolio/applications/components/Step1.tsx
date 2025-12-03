"use client"

import { motion } from "framer-motion"
import { HiUser, HiEnvelope, HiMapPin } from "react-icons/hi2"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/ui/phone-input"

interface Step1Props {
  formData: any
  updateField: (field: string, value: any) => void
  errors: Record<string, string>
}

const Step1 = ({ formData, updateField, errors }: Step1Props) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
      <p className="text-gray-600">Tell us about yourself and your contact details</p>
    </div>

    <div className="space-y-6">
      {/* First Name and Last Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">First Name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
              <HiUser className="text-blue-500 w-4 h-4" />
            </div>
            <Input
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="pl-12 h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
            />
          </div>
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Last Name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
              <HiUser className="text-blue-500 w-4 h-4" />
            </div>
            <Input
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="pl-12 h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
            />
          </div>
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
        </div>
      </div>

      {/* Address Row */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Address</label>
        <div className="relative">
          <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
            <HiMapPin className="text-green-500 w-4 h-4" />
          </div>
          <Textarea
            placeholder="Enter your full address"
            value={formData.applicantAddress}
            onChange={(e) => updateField('applicantAddress', e.target.value)}
            className="pl-12 min-h-[120px] rounded-2xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none w-full"
          />
        </div>
        {errors.applicantAddress && <p className="text-red-500 text-sm">{errors.applicantAddress}</p>}
      </div>

      {/* Email and Phone Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email Address</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
              <HiEnvelope className="text-purple-500 w-4 h-4" />
            </div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.applicantEmail}
              onChange={(e) => updateField('applicantEmail', e.target.value)}
              className="pl-12 h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
            />
          </div>
          {errors.applicantEmail && <p className="text-red-500 text-sm">{errors.applicantEmail}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <PhoneInput
            value={formData.applicantPhone}
            onChange={(value) => updateField('applicantPhone', value)}
            countryCode={formData.phoneCountryCode}
            onCountryCodeChange={(code) => updateField('phoneCountryCode', code)}
            placeholder="Enter phone number"
            error={errors.applicantPhone}
          />
        </div>
      </div>
    </div>
  </motion.div>
)

export default Step1
