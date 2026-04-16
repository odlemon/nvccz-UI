import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(4, 'Password must be at least 6 characters')
    .required('Password is required'),
})

export type LoginFormData = yup.InferType<typeof loginSchema>
