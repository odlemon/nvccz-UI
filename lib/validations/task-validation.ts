import * as yup from 'yup'

export const taskValidationSchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  
  category: yup
    .string()
    .oneOf(['investment', 'operational', 'strategic', 'compliance'], 'Invalid category')
    .required('Category is required'),
  
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Invalid priority')
    .required('Priority is required'),
  
  startDate: yup
    .string()
    .required('Start date is required'),
  
  endDate: yup
    .string()
    .required('End date is required')
    .test('end-date-after-start', 'End date must be after start date', function(value) {
      const { startDate } = this.parent
      if (!value || !startDate) return true
      return new Date(value) > new Date(startDate)
    }),
  
  assignedToId: yup
    .string()
    .max(50, 'Assigned to ID must not exceed 50 characters'),
  
  team: yup
    .array()
    .of(yup.string())
    .optional(),
  
  goalId: yup
    .string()
    .max(50, 'Goal ID must not exceed 50 characters'),
  
  performanceCategory: yup
    .string()
    .max(50, 'Performance category must not exceed 50 characters'),
  
  isPerformanceTask: yup
    .boolean(),
  
  monetaryValue: yup
    .number()
    .min(0, 'Monetary value must be positive')
    .typeError('Monetary value must be a number'),
  
  percentValue: yup
    .number()
    .min(0, 'Percent value must be between 0 and 100')
    .max(100, 'Percent value must be between 0 and 100')
    .typeError('Percent value must be a number'),
  
  kpi: yup
    .object()
    .shape({
      type: yup.string().required(),
      target: yup.number().required(),
      unit: yup.string().required()
    })
    .optional(),
  
  ruleset: yup
    .string()
    .oneOf(['>=', '<=', '=', '>', '<'], 'Invalid ruleset')
    .optional(),
  
  status: yup
    .string()
    .oneOf(['not_started', 'in_progress', 'completed', 'cancelled'], 'Invalid status')
    .required('Status is required'),
  
  progress: yup
    .number()
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100')
    .typeError('Progress must be a number')
    .required('Progress is required'),
})

export type TaskFormData = yup.InferType<typeof taskValidationSchema>
