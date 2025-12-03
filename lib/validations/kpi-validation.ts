import * as yup from 'yup'

export const kpiValidationSchema = yup.object({
  name: yup
    .string()
    .required('KPI name is required')
    .min(3, 'KPI name must be at least 3 characters')
    .max(100, 'KPI name must not exceed 100 characters'),
  
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters'),
  
  type: yup
    .string()
    .required('KPI type is required')
    .oneOf(['Metric', 'Percentage', 'Number', 'Currency', 'Ratio'], 'Invalid KPI type'),
  
  unit: yup
    .string()
    .required('Unit is required')
    .max(20, 'Unit must not exceed 20 characters'),
  
  targetValue: yup
    .number()
    .min(0, 'Target value must be positive')
    .required('Target value is required'),
  
  currentValue: yup
    .number()
    .min(0, 'Current value must be positive')
    .required('Current value is required'),
  
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['sales', 'financial', 'operational', 'investment'], 'Invalid category'),
  
  frequency: yup
    .string()
    .required('Frequency is required')
    .oneOf(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 'Invalid frequency'),
  
  departmentId: yup
    .string()
    .max(50, 'Department ID must not exceed 50 characters'),
  
  weightValue: yup
    .number()
    .min(0, 'Weight value must be positive')
    .max(1, 'Weight value must not exceed 1')
    .required('Weight value is required'),
  
  isActive: yup
    .boolean()
    .required('Active status is required')
})

export type KPIFormData = yup.InferType<typeof kpiValidationSchema>
