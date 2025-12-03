"use client"

import { motion } from "framer-motion"
import { HiBuildingOffice, HiCurrencyDollar } from "react-icons/hi2"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

interface Step2Props {
  formData: any
  updateField: (field: string, value: any) => void
  errors: Record<string, string>
}

const Step2 = ({ formData, updateField, errors }: Step2Props) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <h2 className="text-2xl font-normal text-gray-900 mb-2">Business Information</h2>
      <p className="text-gray-600">Tell us about your business and funding requirements</p>
    </div>

    <div className="space-y-6">
      {/* Business Name Row */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Business Name</label>
        <div className="relative">
          <HiBuildingOffice className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Enter business name"
            value={formData.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            className="pl-10 h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
          />
        </div>
        {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName}</p>}
      </div>

      {/* Industry and Business Stage Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Industry</label>
          <Select value={formData.industry} onValueChange={(value) => updateField('industry', value)}>
            <SelectTrigger className="h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Agriculture">Agriculture</SelectItem>
              <SelectItem value="Energy">Energy</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-red-500 text-sm">{errors.industry}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Business Stage</label>
          <Select value={formData.businessStage} onValueChange={(value) => updateField('businessStage', value)}>
            <SelectTrigger className="h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
              <SelectValue placeholder="Select business stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STARTUP">Startup</SelectItem>
              <SelectItem value="GROWTH">Growth</SelectItem>
              <SelectItem value="MATURE">Mature</SelectItem>
              <SelectItem value="EXPANSION">Expansion</SelectItem>
            </SelectContent>
          </Select>
          {errors.businessStage && <p className="text-red-500 text-sm">{errors.businessStage}</p>}
        </div>
      </div>

      {/* Founding Date and Requested Amount Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Founding Date</label>
          <DatePicker
            value={formData.foundingDate ? new Date(formData.foundingDate) : undefined}
            onChange={(date) => updateField('foundingDate', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Select founding date"
            className="w-full"
          />
          {errors.foundingDate && <p className="text-red-500 text-sm">{errors.foundingDate}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Requested Amount ($)</label>
          <div className="relative">
            <HiCurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="number"
              placeholder="Enter requested amount"
              value={formData.requestedAmount || ''}
              onChange={(e) => updateField('requestedAmount', parseFloat(e.target.value) || 0)}
              className="pl-10 h-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
            />
          </div>
          {errors.requestedAmount && <p className="text-red-500 text-sm">{errors.requestedAmount}</p>}
        </div>
      </div>

      {/* Business Description Row */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Business Description</label>
        <Textarea
          placeholder="Describe your business, products/services, and market opportunity"
          value={formData.businessDescription}
          onChange={(e) => updateField('businessDescription', e.target.value)}
          className="min-h-[140px] rounded-2xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none w-full"
        />
        {errors.businessDescription && <p className="text-red-500 text-sm">{errors.businessDescription}</p>}
      </div>
    </div>
  </motion.div>
)

export default Step2
