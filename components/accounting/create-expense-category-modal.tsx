"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { accountingApi, ExpenseCategory, CreateExpenseCategoryRequest } from "@/lib/api/accounting-api"

interface CreateExpenseCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category?: ExpenseCategory | null
  categories: ExpenseCategory[]
}

export function CreateExpenseCategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  category, 
  categories 
}: CreateExpenseCategoryModalProps) {
  const [formData, setFormData] = useState<CreateExpenseCategoryRequest>({
    name: "",
    description: "",
    parentId: "",
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!category

  // Get parent categories (no parentId)
  const parentCategories = categories.filter(cat => !cat.parentId && cat.isActive)

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          description: category.description || "",
          parentId: category.parentId || "",
          isActive: category.isActive
        })
      } else {
        setFormData({
          name: "",
          description: "",
          parentId: "",
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, category])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        description: formData.description?.trim() || undefined,
        parentId: formData.parentId?.trim() || undefined
      }

      let response
      if (isEditing && category) {
        response = await accountingApi.updateExpenseCategory(category.id, payload)
      } else {
        response = await accountingApi.createExpenseCategory(payload)
      }

      if (response.success) {
        toast.success(isEditing ? "Category updated successfully" : "Category created successfully")
        onSuccess()
      } else {
        throw new Error(response.error || 'Failed to save category')
      }
    } catch (error: any) {
      toast.error(isEditing ? "Failed to update category" : "Failed to create category", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateExpenseCategoryRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isEditing ? "Edit Expense Category" : "Create New Expense Category"}</span>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing ? "Update category information" : "Add a new expense category to organize your expenses"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name & Parent Category Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Office Supplies"
                disabled={isLoading}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Category</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => handleInputChange("parentId", value === "none" ? "" : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} disabled={isEditing && cat.id === category?.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this category is used for..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-gray-500">Enable this category for expense tracking</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              disabled={isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant={isEditing ? "gradient-update" : "gradient-create"}
              className="rounded-full px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Category" : "Create Category"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}