'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, ChevronRight, ChevronLeft, Building2, Mail, Phone, Globe, Upload, CheckCircle2, Landmark, Plus, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

interface VendorBankInput {
  bankName: string
  accountName: string
  accountNumber: string
  branchCode: string
  currencyCode: 'USD' | 'ZWL' | 'ZIG'
  swiftCode: string
}

interface RegistrationFormData {
  companyName: string
  name: string
  email: string
  contactPerson: string
  phoneNumber: string
  industry: string
  banks: VendorBankInput[]
}

interface KYCSlot {
  code: 'CR14' | 'BANK_LETTER' | 'CERTIFICATE_OF_INCORPORATION' | 'ITF263' | 'OTHER'
  label: string
  description?: string
  required: boolean
}

interface UploadedKycDoc {
  id: string
  documentType: KYCSlot['code']
  fileName: string
}

const DEFAULT_KYC_SLOTS: KYCSlot[] = [
  { code: 'CERTIFICATE_OF_INCORPORATION', label: 'Certificate of incorporation', required: true },
  { code: 'CR14', label: 'CR14 - company extract', required: true },
  { code: 'BANK_LETTER', label: 'Bank confirmation / account letter', required: true },
  { code: 'ITF263', label: 'ZIMRA tax clearance (ITF 263)', required: false },
  { code: 'OTHER', label: 'Other supporting document', required: false },
]

const KYC_TOKEN_KEY = 'vendorRegistrationKycToken'
const KYC_DOCUMENTS_URL_KEY = 'kycDocumentsUrl'
const CURRENCY_OPTIONS: Array<'USD' | 'ZWL' | 'ZIG'> = ['USD', 'ZWL', 'ZIG']

export function VendorRegistrationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [kycToken, setKycToken] = useState('')
  const [kycDocumentsUrl, setKycDocumentsUrl] = useState('')
  const [kycSlots, setKycSlots] = useState<KYCSlot[]>(DEFAULT_KYC_SLOTS)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedKycDoc>>({})
  const [loadingKycMeta, setLoadingKycMeta] = useState(false)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [uploadingDocCode, setUploadingDocCode] = useState<string | null>(null)
  const [isUploadConfirmOpen, setIsUploadConfirmOpen] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<{ code: KYCSlot['code']; file: File } | null>(null)

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      companyName: '',
      name: '',
      email: '',
      contactPerson: '',
      phoneNumber: '',
      industry: '',
      banks: [
        {
          bankName: '',
          accountName: '',
          accountNumber: '',
          branchCode: '',
          currencyCode: 'USD',
          swiftCode: '',
        },
      ],
    },
  })

  const { fields: bankFields, append, remove } = useFieldArray({
    control,
    name: 'banks',
  })

  useEffect(() => {
    const tokenFromUrl = searchParams?.get('token') || ''
    const tokenFromStorage = sessionStorage.getItem(KYC_TOKEN_KEY) || ''
    const kycUrlFromStorage = sessionStorage.getItem(KYC_DOCUMENTS_URL_KEY) || ''
    const restoredToken = tokenFromUrl || tokenFromStorage

    if (!restoredToken) return

    setKycToken(restoredToken)
    setKycDocumentsUrl(kycUrlFromStorage)
    setStep(3)
    sessionStorage.setItem(KYC_TOKEN_KEY, restoredToken)

    if (!tokenFromUrl) {
      window.history.replaceState({}, '', `/vendor-portal/register?token=${encodeURIComponent(restoredToken)}`)
    }
  }, [searchParams])

  useEffect(() => {
    const loadRequirements = async () => {
      if (!kycToken) return

      setLoadingKycMeta(true)
      try {
        const response = await procurementApiV2.getKYCRequirements(kycToken)
        const rows = (response.data as any)?.documentTypes || (response.data as any)?.requirements || (response.data as any)?.slots || []

        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: KYCSlot[] = rows
            .map((row: any) => ({
              code: (row.code || row.documentType || '').toString().toUpperCase(),
              label: row.label || row.name || row.documentType || 'KYC Document',
              description: row.description || undefined,
              required: Boolean(row.requiredForPortal ?? row.required),
            }))
            .filter((row: KYCSlot) => Boolean(row.code)) as KYCSlot[]

          if (mapped.length > 0) {
            setKycSlots(mapped)
          }
        }
      } catch (error) {
        console.error('Failed to load KYC requirements:', error)
      } finally {
        setLoadingKycMeta(false)
      }
    }

    loadRequirements()
  }, [kycToken])

  useEffect(() => {
    const loadUploadedDocs = async () => {
      if (!kycToken) return

      try {
        const response = await procurementApiV2.getKYCDocuments(kycToken)
        if (!response.success || !Array.isArray(response.data)) return

        const uploaded = response.data.reduce((acc, doc: any) => {
          const type = (doc.documentType || '').toString().toUpperCase()
          if (!type) return acc

          acc[type] = {
            id: doc.id,
            documentType: type,
            fileName: doc.fileName || `${type}.pdf`,
          }

          return acc
        }, {} as Record<string, UploadedKycDoc>)

        setUploadedDocs(uploaded)
      } catch (error) {
        console.error('Failed to load uploaded KYC documents:', error)
      }
    }

    loadUploadedDocs()
  }, [kycToken])

  const moveNext = async () => {
    if (step === 1) {
      const valid = await trigger(['companyName', 'name', 'email', 'contactPerson', 'phoneNumber', 'industry'])
      if (!valid) {
        toast.error('Please complete all required company details')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      const bankValues = getValues('banks') || []
      if (bankValues.length === 0) {
        toast.error('Add at least one bank account')
        return
      }

      const valid = await trigger('banks')

      if (!valid) {
        toast.error('Please complete bank details before submitting')
        return
      }

      handleSubmit(onSubmit)()
    }
  }

  const moveBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const onSubmit = async (data: RegistrationFormData) => {
    setLoading(true)
    try {
      const payload = {
        companyName: data.companyName,
        name: data.name || data.companyName,
        email: data.email,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        industry: data.industry,
        banks: data.banks.map((bank) => ({
          bankName: bank.bankName,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          branchCode: bank.branchCode,
          currencyCode: bank.currencyCode,
          swiftCode: bank.swiftCode || undefined,
        })),
      }

      const response = await procurementApiV2.vendorSelfRegister(payload)

      if (!response.success || !response.data?.kycUploadToken) {
        toast.error('Registration failed', { description: response.message || 'Please try again' })
        return
      }

      const token = response.data.kycUploadToken
      setKycToken(token)
      sessionStorage.setItem(KYC_TOKEN_KEY, token)
      sessionStorage.setItem('vendorName', data.companyName)
      if (response.data.kycDocumentsUrl) {
        setKycDocumentsUrl(response.data.kycDocumentsUrl)
        sessionStorage.setItem(KYC_DOCUMENTS_URL_KEY, response.data.kycDocumentsUrl)
      }

      window.history.replaceState({}, '', `/vendor-portal/register?token=${encodeURIComponent(token)}`)

      toast.success('Registration submitted. Continue with KYC documents.')
      setStep(3)
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to register'
      toast.error('Registration failed', { description })
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onKycFileChange = (docCode: KYCSlot['code'], file: File | null) => {
    if (!file) {
      setUploadedDocs((prev) => {
        const next = { ...prev }
        delete next[docCode]
        return next
      })
      return
    }

    setPendingUpload({ code: docCode, file })
    setIsUploadConfirmOpen(true)
  }

  const confirmAndUploadDocument = async () => {
    if (!pendingUpload || !kycToken) {
      setIsUploadConfirmOpen(false)
      return
    }

    setUploadingDocCode(pendingUpload.code)

    try {
      const formData = new FormData()
      formData.append('file', pendingUpload.file)
      formData.append('documentType', pendingUpload.code)

      const response = await procurementApiV2.uploadKYCDocuments(kycToken, formData)
      const uploaded = response.data as any

      if (!response.success || !uploaded?.id) {
        toast.error('Upload failed', { description: response.message || 'Please try again' })
        return
      }

      setUploadedDocs((prev) => ({
        ...prev,
        [pendingUpload.code]: {
          id: uploaded.id,
          documentType: pendingUpload.code,
          fileName: uploaded.fileName || pendingUpload.file.name,
        },
      }))

      toast.success(`${pendingUpload.code} uploaded successfully`)
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Upload failed'
      toast.error('Upload failed', { description })
    } finally {
      setUploadingDocCode(null)
      setPendingUpload(null)
      setIsUploadConfirmOpen(false)
    }
  }

  const submitKyc = async () => {
    if (!kycToken) {
      toast.error('Missing KYC token. Please complete registration first.')
      return
    }

    const missingRequired = kycSlots
      .filter((slot) => slot.required)
      .filter((slot) => !uploadedDocs[slot.code])

    if (missingRequired.length > 0) {
      toast.error(`Missing required KYC docs: ${missingRequired.map((slot) => slot.label).join(', ')}`)
      return
    }

    setUploadingKyc(true)
    try {
      toast.success('KYC documents uploaded. Your registration is pending staff review.')
      router.push('/vendor-portal')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Upload failed'
      toast.error('KYC upload failed', { description })
      console.error('KYC upload error:', error)
    } finally {
      setUploadingKyc(false)
    }
  }

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 size={18} />
                Company Name *
              </Label>
              <Controller
                name="companyName"
                control={control}
                rules={{ required: 'Company name is required' }}
                render={({ field }) => (
                  <div>
                    <Input {...field} id="companyName" placeholder="Blessing Car Supplies" className={errors.companyName ? 'border-red-500' : ''} />
                    {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 size={18} />
                Display Name *
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Display name is required' }}
                render={({ field }) => (
                  <div>
                    <Input {...field} id="name" placeholder="Blessing Car Supplies" className={errors.name ? 'border-red-500' : ''} />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={18} />
              Email Address *
            </Label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
              }}
              render={({ field }) => (
                <div>
                  <Input {...field} id="email" type="email" placeholder="contact@company.com" className={errors.email ? 'border-red-500' : ''} />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="flex items-center gap-2">
                <Mail size={18} />
                Contact Person *
              </Label>
              <Controller
                name="contactPerson"
                control={control}
                rules={{ required: 'Contact person is required' }}
                render={({ field }) => (
                  <div>
                    <Input {...field} id="contactPerson" placeholder="Casa Draxler" className={errors.contactPerson ? 'border-red-500' : ''} />
                    {errors.contactPerson && <p className="text-sm text-red-500 mt-1">{errors.contactPerson.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone size={18} />
                Phone Number *
              </Label>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <div>
                    <Input {...field} id="phoneNumber" placeholder="+263772440088" className={errors.phoneNumber ? 'border-red-500' : ''} />
                    {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2">
              <Globe size={18} />
              Industry *
            </Label>
            <Controller
              name="industry"
              control={control}
              rules={{ required: 'Industry is required' }}
              render={({ field }) => (
                <div>
                  <Input {...field} id="industry" placeholder="Services" className={errors.industry ? 'border-red-500' : ''} />
                  {errors.industry && <p className="text-sm text-red-500 mt-1">{errors.industry.message}</p>}
                </div>
              )}
            />
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Bank details are required to complete vendor profile setup.
          </div>

          {bankFields.map((bank, index) => (
            <div key={bank.id} className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Bank #{index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={bankFields.length === 1}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`bankName-${index}`} className="flex items-center gap-2">
                    <Landmark size={18} />
                    Bank Name *
                  </Label>
                  <Controller
                    name={`banks.${index}.bankName` as const}
                    control={control}
                    rules={{ required: 'Bank name is required' }}
                    render={({ field }) => (
                      <div>
                        <Input {...field} id={`bankName-${index}`} placeholder="CBZ" className={errors.banks?.[index]?.bankName ? 'border-red-500' : ''} />
                        {errors.banks?.[index]?.bankName && <p className="text-sm text-red-500 mt-1">{errors.banks[index]?.bankName?.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`accountName-${index}`}>Account Name *</Label>
                  <Controller
                    name={`banks.${index}.accountName` as const}
                    control={control}
                    rules={{ required: 'Account name is required' }}
                    render={({ field }) => (
                      <div>
                        <Input {...field} id={`accountName-${index}`} placeholder="Blessing Mwale" className={errors.banks?.[index]?.accountName ? 'border-red-500' : ''} />
                        {errors.banks?.[index]?.accountName && <p className="text-sm text-red-500 mt-1">{errors.banks[index]?.accountName?.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`accountNumber-${index}`}>Account Number *</Label>
                  <Controller
                    name={`banks.${index}.accountNumber` as const}
                    control={control}
                    rules={{ required: 'Account number is required' }}
                    render={({ field }) => (
                      <div>
                        <Input {...field} id={`accountNumber-${index}`} placeholder="121212121" className={errors.banks?.[index]?.accountNumber ? 'border-red-500' : ''} />
                        {errors.banks?.[index]?.accountNumber && <p className="text-sm text-red-500 mt-1">{errors.banks[index]?.accountNumber?.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`branchCode-${index}`}>Branch Code *</Label>
                  <Controller
                    name={`banks.${index}.branchCode` as const}
                    control={control}
                    rules={{ required: 'Branch code is required' }}
                    render={({ field }) => (
                      <div>
                        <Input {...field} id={`branchCode-${index}`} placeholder="1212" className={errors.banks?.[index]?.branchCode ? 'border-red-500' : ''} />
                        {errors.banks?.[index]?.branchCode && <p className="text-sm text-red-500 mt-1">{errors.banks[index]?.branchCode?.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`currencyCode-${index}`}>Currency *</Label>
                  <Controller
                    name={`banks.${index}.currencyCode` as const}
                    control={control}
                    rules={{ required: 'Currency is required' }}
                    render={({ field }) => (
                      <div>
                        <select
                          {...field}
                          id={`currencyCode-${index}`}
                          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.banks?.[index]?.currencyCode ? 'border-red-500' : 'border-input'}`}
                        >
                          {CURRENCY_OPTIONS.map((currency) => (
                            <option key={currency} value={currency}>{currency}</option>
                          ))}
                        </select>
                        {errors.banks?.[index]?.currencyCode && <p className="text-sm text-red-500 mt-1">{errors.banks[index]?.currencyCode?.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`swiftCode-${index}`}>SWIFT Code</Label>
                  <Controller
                    name={`banks.${index}.swiftCode` as const}
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id={`swiftCode-${index}`} placeholder="2121" />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => append({
              bankName: '',
              accountName: '',
              accountNumber: '',
              branchCode: '',
              currencyCode: 'USD',
              swiftCode: '',
            })}
          >
            <Plus className="w-4 h-4" />
            Add Another Bank
          </Button>
        </div>
      )
    }

    const requiredSlots = kycSlots.filter((slot) => slot.required)
    const optionalSlots = kycSlots.filter((slot) => !slot.required)

    const renderKycCard = (slot: KYCSlot, isRequired: boolean) => {
      const uploaded = uploadedDocs[slot.code]
      const elementId = `kyc-${slot.code}`
      const isUploadingThisDoc = uploadingDocCode === slot.code

      return (
        <div key={slot.code} className="group relative border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
            {uploaded ? (
              <div className="text-center px-3">
                <FileText className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-blue-700 font-medium truncate max-w-[170px]">{uploaded.fileName}</p>
              </div>
            ) : (
              <div className="text-center px-3">
                <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-blue-700 font-medium">{isUploadingThisDoc ? 'Uploading...' : 'Add Document'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{slot.label}</p>
                <p className="text-xs text-gray-500">{slot.description || 'Upload a clear scan or PDF.'}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isRequired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {isRequired ? 'Required' : 'Optional'}
              </span>
            </div>

            <label htmlFor={elementId} className="block cursor-pointer">
              <div className="border border-dashed border-gray-300 rounded-lg py-2 px-3 text-center text-xs text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                {uploaded ? 'Replace File' : 'Upload File'}
              </div>
            </label>
            <input
              id={elementId}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={isUploadingThisDoc}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null
                onKycFileChange(slot.code, nextFile)
              }}
            />

            {uploaded && (
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-700"
                onClick={() => onKycFileChange(slot.code, null)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-2">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Upload KYC Documents</h3>
          <p className="text-sm text-gray-600">Upload required compliance documents to complete registration.</p>
        </div>

        {loadingKycMeta ? (
          <div className="py-10 flex items-center justify-center text-gray-600 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading KYC requirements...
          </div>
        ) : (
          <>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requiredSlots.map((slot) => renderKycCard(slot, true))}
              </div>
            </div>

            {optionalSlots.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Optional Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {optionalSlots.map((slot) => renderKycCard(slot, false))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                className="rounded-full h-11 px-6 gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={submitKyc}
                disabled={uploadingKyc || !kycToken}
              >
                {uploadingKyc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit KYC Documents
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Logo" width={160} height={56} className="object-contain" priority />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vendor Self-Registration</h1>
          <p className="text-lg text-gray-600">Complete your profile, upload KYC, then await staff approval</p>
        </div>

        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((current) => {
            const active = step === current
            const done = step > current
            return (
              <div key={current} className="flex items-center flex-1">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {current}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                    {current === 1 ? 'Company Info' : current === 2 ? 'Bank Details' : 'KYC Upload'}
                  </span>
                </div>
                {current < 3 && <div className="flex-1 h-1 bg-gray-200 mx-3" />}
              </div>
            )
          })}
        </div>

        <Card className="shadow-lg border border-gray-200 rounded-2xl">
          <CardHeader className="bg-white rounded-t-2xl border-b border-gray-100 px-8 py-6 text-center">
            <CardTitle className="text-gray-900">
              {step === 1 && 'Step 1: Company Information'}
              {step === 2 && 'Step 2: Bank Information'}
              {step === 3 && 'Step 3: Compliance & KYC Upload'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1 && 'Tell us who you are and how to contact you'}
              {step === 2 && 'Provide primary banking details for vendor master setup'}
              {step === 3 && 'Use your token to upload all required compliance documents'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onKeyDown={(event) => {
              if (event.key === 'Enter' && step !== 3) {
                event.preventDefault()
              }
            }}>
              {renderStepContent()}

              {step < 3 && (
                <div className="pt-6 flex items-center justify-between">
                  <Button
                    type="button"
                    onClick={moveBack}
                    disabled={step === 1 || loading}
                    className="gap-2 rounded-full h-11 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    disabled={loading}
                    onClick={moveNext}
                    className="rounded-full h-11 px-6 gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {step === 2 ? 'Submit Registration' : 'Next'}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Flow: Register, upload KYC with token, then staff reviews and approves activation.</p>
        </div>
      </div>

      <Dialog open={isUploadConfirmOpen} onOpenChange={setIsUploadConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Selected Document</DialogTitle>
            <DialogDescription>
              The selected file will be uploaded first for {pendingUpload?.code || 'this document type'}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            {pendingUpload ? `File: ${pendingUpload.file.name}` : 'No file selected'}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsUploadConfirmOpen(false)
              setPendingUpload(null)
            }} disabled={Boolean(uploadingDocCode)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmAndUploadDocument} disabled={Boolean(uploadingDocCode)}>
              {uploadingDocCode ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload File'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
