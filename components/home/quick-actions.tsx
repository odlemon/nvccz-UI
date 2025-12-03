"use client"

import { motion } from "framer-motion"
import { 
  CiLineHeight, 
  CiViewTable, 
  CiFileOn, 
  CiShop, 
  CiBank, 
  CiUser,
  CiCircleChevRight
} from "react-icons/ci"
import Link from "next/link"

const quickActions = [
  {
    id: "portfolio",
    title: "Portfolio Management",
    icon: CiLineHeight,
    href: "/portfolio",
    description: "Manage investments",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    id: "performance",
    title: "Performance Management", 
    icon: CiViewTable,
    href: "/portfolio/analytics",
    description: "Track performance",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: "applications",
    title: "Applications",
    icon: CiFileOn,
    href: "/applications",
    description: "Review applications",
    gradient: "from-purple-500 to-violet-600"
  },
  {
    id: "companies",
    title: "Companies",
    icon: CiShop,
    href: "/companies",
    description: "Company database",
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: "funds",
    title: "Funds",
    icon: CiBank,
    href: "/funds",
    description: "Fund management",
    gradient: "from-yellow-500 to-amber-600"
  },
  {
    id: "account",
    title: "Account & Performance",
    icon: CiUser,
    href: "/account",
    description: "Account settings",
    gradient: "from-teal-500 to-cyan-600"
  }
]

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={action.href}>
              <div className="group relative p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 cursor-pointer">
                {/* Gradient border effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                <div className="relative flex flex-col items-center text-center space-y-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors">
                      {action.description}
                    </p>
                  </div>
                  
                  <CiCircleChevRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
