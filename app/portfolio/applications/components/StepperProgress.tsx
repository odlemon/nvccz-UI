"use client"

import { motion } from "framer-motion"
import { CiUser, CiBank, CiFileOn, CiCircleCheck } from "react-icons/ci"

interface StepperProgressProps {
  currentStep: number
}

const StepperProgress = ({ currentStep }: StepperProgressProps) => {
  const steps = [
    { 
      id: 1, 
      title: "User Details", 
      description: "Personal details and contact information",
      icon: CiUser,
      days: "0 Days" 
    },
    { 
      id: 2, 
      title: "Company Info", 
      description: "Company details and business model",
      icon: CiBank,
      days: "24 Days" 
    },
    { 
      id: 3, 
      title: "Company Docs", 
      description: "Required documents and attachments",
      icon: CiFileOn,
      days: "48 Days" 
    },
    
  ]

  const getStepStatus = (stepId: number) => {
    if (currentStep > stepId) return 'completed'
    if (currentStep === stepId) return 'current'
    return 'pending'
  }


  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Step Titles and Descriptions - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          const status = getStepStatus(step.id)
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer"
            >
              {/* Icon Column */}
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  status === 'completed' 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-600 shadow-sm' 
                    : status === 'current'
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-600 shadow-sm'
                      : 'bg-gradient-to-br from-gray-100 to-slate-200 text-gray-400 shadow-sm'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              {/* Content Column */}
              <div className="flex-1 ">
                <h3 className={`text-sm font-normal mb-1 ${
                  status === 'current' ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Enhanced Progress Bar with Integrated Days */}
      <div className="relative">
        {/* Main Progress Bar Container */}
        <div className="flex items-center w-full h-14 relative">
          {/* Faint Blue Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-full" />
          
          {/* Completed Section (solid gradient bar) */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-14 rounded-full flex items-center justify-end pr-3 shadow-lg relative z-10"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Show current step number inside completed bar */}
            {currentStep > 0 && (
              <motion.div
                className="bg-white/20 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-white font-bold text-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {currentStep}
              </motion.div>
            )}
          </motion.div>

          {/* Remaining Section - Bar Graphs */}
          
        </div>

      </div>
    </div>
  )
}

export default StepperProgress
