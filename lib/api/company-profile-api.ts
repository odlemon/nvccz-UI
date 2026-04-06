import { apiClient } from './api-client'

export interface CompanyAddress {
  id: string
  companyProfileId: string
  label: string
  logoUrl: string | null
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string | null
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressFormData {
  label: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isActive: boolean
  logo?: File | null
}

class CompanyProfileApi {
  async getAddresses(): Promise<{ success: boolean; data: CompanyAddress[] }> {
    return apiClient.get('/company-profile/addresses')
  }

  async getActiveAddress(): Promise<CompanyAddress | null> {
    const res = await this.getAddresses()
    return res.data?.find(a => a.isActive) ?? null
  }

  async createAddress(data: AddressFormData): Promise<{ success: boolean; message: string; data: CompanyAddress }> {
    const form = new FormData()
    form.append('label', data.label)
    form.append('line1', data.line1)
    if (data.line2) form.append('line2', data.line2)
    form.append('city', data.city)
    if (data.state) form.append('state', data.state)
    if (data.postalCode) form.append('postalCode', data.postalCode)
    form.append('country', data.country)
    form.append('isActive', String(data.isActive))
    if (data.logo) form.append('logo', data.logo)
    return apiClient.postFormData('/company-profile/addresses', form)
  }

  async updateAddress(
    id: string,
    data: AddressFormData
  ): Promise<{ success: boolean; message: string; data: CompanyAddress }> {
    const form = new FormData()
    form.append('label', data.label)
    form.append('line1', data.line1)
    if (data.line2) form.append('line2', data.line2)
    form.append('city', data.city)
    if (data.state) form.append('state', data.state)
    if (data.postalCode) form.append('postalCode', data.postalCode)
    form.append('country', data.country)
    form.append('isActive', String(data.isActive))
    if (data.logo) form.append('logo', data.logo)
    return apiClient.putFormData(`/company-profile/addresses/${id}`, form)
  }

  async deleteAddress(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/company-profile/addresses/${id}`)
  }

  async setActiveAddress(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/company-profile/addresses/${id}/set-active`)
  }
}

export const companyProfileApi = new CompanyProfileApi()
