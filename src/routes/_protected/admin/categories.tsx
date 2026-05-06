import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Loader } from '@/components/common/Loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listAllCategoriesFn,
  createCategoryFn,
  updateCategoryFn,
  deleteCategoryFn,
} from '@/server/functions/categories'
import type { Categories } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/categories')({
  loader: async () => {
    const [profileResult, categoriesResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listAllCategoriesFn().catch(() => ({ categories: [] })),
    ])

    const userProfile = profileResult.user
    const isExamAdmin =
      userProfile?.accessLevel === 'exam_admin' && !userProfile?.isAdmin

    return {
      userProfile,
      isExamAdmin,
      categories: categoriesResult.categories,
    }
  },
  component: AdminCategoriesPage,
})

function AdminCategoriesPage() {
  const {
    userProfile,
    isExamAdmin,
    categories: initialCategories,
  } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Categories | null>(
    null,
  )

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: 'trainee_resident' as const,
    parentId: '_none' as string,
    poolNumbers: '',
    order: '',
    description: '',
    isActive: true,
  })

  const listCategories = useServerFn(listAllCategoriesFn)
  const createCategory = useServerFn(createCategoryFn)
  const updateCategory = useServerFn(updateCategoryFn)
  const deleteCategory = useServerFn(deleteCategoryFn)

  const {
    data: categoriesData,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => listCategories(),
    initialData: { categories: initialCategories },
  })

  // Check if a category has pool numbers assigned
  const hasPools = (category: Categories): boolean => {
    return !!(category.poolNumbers && category.poolNumbers.length > 0)
  }

  // Check if a category has subcategories
  const hasSubcategories = (categoryId: string): boolean => {
    return categoriesData.categories.some(
      (c: Categories) => c.parentId === categoryId,
    )
  }

  // Get available parent categories for the select
  // A category can be a parent only if it has NO pool numbers assigned
  const getAvailableParentCategories = () => {
    return categoriesData.categories.filter((c: Categories) => {
      // Exclude current category when editing
      if (selectedCategory && c.$id === selectedCategory.$id) return false
      // Only show top-level categories without pools as potential parents
      if (c.parentId) return false
      // Categories with pools cannot have subcategories
      if (hasPools(c)) return false
      return true
    })
  }

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const poolNumbers = formData.poolNumbers
        .split(',')
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n))

      // Validation: If selecting a parent that has pools, reject
      if (formData.parentId && formData.parentId !== '_none') {
        const parent = categoriesData.categories.find(
          (c: Categories) => c.$id === formData.parentId,
        )
        if (parent && hasPools(parent)) {
          throw new Error(
            'Cannot add subcategory to a category with pool numbers assigned',
          )
        }
      }

      return await createCategory({
        data: {
          name: formData.name,
          domain: formData.domain,
          parentId: formData.parentId === '_none' ? null : formData.parentId,
          poolNumbers: poolNumbers.length > 0 ? poolNumbers : null,
          order: formData.order ? parseInt(formData.order) : null,
          description: formData.description || null,
          isActive: formData.isActive,
        },
      })
    },
    onSuccess: () => {
      toast.success('Category created successfully')
      setShowCreateDialog(false)
      resetForm()
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) return

      const poolNumbers = formData.poolNumbers
        .split(',')
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n))

      // Validation: Cannot add pools if category has subcategories
      if (poolNumbers.length > 0 && hasSubcategories(selectedCategory.$id)) {
        throw new Error(
          'Cannot add pool numbers to a category that has subcategories',
        )
      }

      // Validation: If selecting a parent that has pools, reject
      if (formData.parentId && formData.parentId !== '_none') {
        const parent = categoriesData.categories.find(
          (c: Categories) => c.$id === formData.parentId,
        )
        if (parent && hasPools(parent)) {
          throw new Error(
            'Cannot move to a parent category with pool numbers assigned',
          )
        }
      }

      return await updateCategory({
        data: {
          id: selectedCategory.$id,
          name: formData.name || undefined,
          domain: formData.domain,
          parentId: formData.parentId === '_none' ? null : formData.parentId,
          poolNumbers: poolNumbers.length > 0 ? poolNumbers : null,
          order: formData.order ? parseInt(formData.order) : null,
          description: formData.description || null,
          isActive: formData.isActive,
        },
      })
    },
    onSuccess: () => {
      toast.success('Category updated successfully')
      setShowEditDialog(false)
      setSelectedCategory(null)
      resetForm()
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) return

      // Check if category has subcategories
      if (hasSubcategories(selectedCategory.$id)) {
        throw new Error(
          'Cannot delete category with subcategories. Delete subcategories first.',
        )
      }

      return await deleteCategory({ data: { id: selectedCategory.$id } })
    },
    onSuccess: () => {
      toast.success('Category deleted successfully')
      setShowDeleteDialog(false)
      setSelectedCategory(null)
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      domain: 'trainee_resident',
      parentId: '_none',
      poolNumbers: '',
      order: '',
      description: '',
      isActive: true,
    })
  }

  const openEditDialog = (category: Categories) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      domain: 'trainee_resident' as const,
      parentId: category.parentId || '_none',
      poolNumbers: category.poolNumbers?.join(', ') || '',
      order: category.order?.toString() || '',
      description: category.description || '',
      isActive: category.isActive,
    })
    setShowEditDialog(true)
  }

  // Get parent categories (no parentId)
  const parentCategories = categoriesData.categories.filter(
    (c: Categories) => !c.parentId,
  )

  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categoriesData.categories.filter(
      (c: Categories) => c.parentId === parentId,
    )
  }

  const filteredCategories = parentCategories.filter(
    (category: Categories) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.domain.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getDomainLabel = (domain: string) => {
    switch (domain) {
      case 'trainee_resident':
        return 'Trainee Resident'
      default:
        return domain
    }
  }

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'trainee_resident':
        return 'bg-violet-500/10 text-violet-400'
      default:
        return 'bg-stone-500/10 text-stone-400'
    }
  }

  // Get category type label
  const getCategoryTypeLabel = (category: Categories) => {
    const subcats = getSubcategories(category.$id)
    if (subcats.length > 0) {
      return `${subcats.length} subcategories`
    }
    if (hasPools(category)) {
      return `Pools: ${category.poolNumbers?.join(', ')}`
    }
    return 'No content assigned'
  }

  if (isLoading) {
    return (
      <AdminLayout userProfile={userProfile} isExamAdmin={isExamAdmin}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout userProfile={userProfile} isExamAdmin={isExamAdmin}>
      <div className="max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              className="text-3xl font-semibold text-white mb-2"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Categories Management
            </h1>
            <p className="text-stone-400">
              Organize question pools into categories and subcategories.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Category Structure Rules:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-300/80">
              <li>Categories with pool numbers contain questions directly</li>
              <li>Categories without pools can have subcategories</li>
              <li>You cannot add subcategories to a category with pools</li>
              <li>You cannot add pools to a category with subcategories</li>
            </ul>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="pl-10 bg-stone-900 border-stone-800 text-white placeholder:text-stone-500"
            />
          </div>
        </motion.div>

        {/* Categories List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredCategories.map((category: Categories) => {
            const subcategories = getSubcategories(category.$id)
            const categoryHasPools = hasPools(category)

            return (
              <div
                key={category.$id}
                className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
              >
                {/* Parent Category */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        categoryHasPools
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                          : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20'
                      }`}
                    >
                      <FolderTree
                        className={`w-6 h-6 ${categoryHasPools ? 'text-emerald-400' : 'text-violet-400'}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-white">
                          {category.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getDomainColor(category.domain)}`}
                        >
                          {getDomainLabel(category.domain)}
                        </span>
                        {categoryHasPools && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Has Questions
                          </span>
                        )}
                        {category.isActive ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <p className="text-sm text-stone-400 mt-1">
                        {getCategoryTypeLabel(category)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="text-stone-400 hover:text-white hover:bg-stone-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category)
                        setShowDeleteDialog(true)
                      }}
                      className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories */}
                {subcategories.length > 0 && (
                  <div className="border-t border-stone-800 bg-stone-950/50">
                    {subcategories.map((sub: Categories) => (
                      <div
                        key={sub.$id}
                        className="px-5 py-4 flex items-center justify-between border-b border-stone-800/50 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 pl-8">
                          <ChevronRight className="w-4 h-4 text-stone-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-stone-300">
                                {sub.name}
                              </p>
                              {hasPools(sub) && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                  Questions
                                </span>
                              )}
                              {sub.isActive ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </div>
                            {sub.poolNumbers && (
                              <p className="text-xs text-stone-500">
                                Pools: {sub.poolNumbers.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(sub)}
                            className="text-stone-400 hover:text-white hover:bg-stone-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(sub)
                              setShowDeleteDialog(true)
                            }}
                            className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-16 rounded-2xl bg-stone-900 border border-stone-800">
              <FolderTree className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">No categories found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription className="text-stone-400">
              Add a new category or subcategory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-stone-300">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Category name"
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Domain</Label>
                <Select
                  value={formData.domain}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      domain: v as 'trainee_resident',
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="trainee_resident">
                      Trainee Resident
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-stone-300">
                  Parent Category (Optional)
                </Label>
                <Select
                  value={formData.parentId || '_none'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      parentId: v === '_none' ? '' : v,
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="_none">None (Top Level)</SelectItem>
                    {getAvailableParentCategories().map((cat: Categories) => (
                      <SelectItem key={cat.$id} value={cat.$id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getAvailableParentCategories().length === 0 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    All categories have pools assigned
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Pool Numbers</Label>
                <Input
                  value={formData.poolNumbers}
                  onChange={(e) =>
                    setFormData({ ...formData, poolNumbers: e.target.value })
                  }
                  placeholder="1, 2, 3"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Comma-separated pool numbers (leave empty for container
                  category)
                </p>
              </div>
              <div>
                <Label className="text-stone-300">Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                  placeholder="1"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description..."
                rows={3}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createCategoryMutation.mutate()}
              disabled={createCategoryMutation.isPending || !formData.name}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {createCategoryMutation.isPending
                ? 'Creating...'
                : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription className="text-stone-400">
              Update category information.
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && hasSubcategories(selectedCategory.$id) && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                This category has subcategories. You cannot add pool numbers to
                it.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-stone-300">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Domain</Label>
                <Select
                  value={formData.domain}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      domain: v as 'trainee_resident',
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="trainee_resident">
                      Trainee Resident
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-stone-300">Parent Category</Label>
                <Select
                  value={formData.parentId || '_none'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      parentId: v === '_none' ? '' : v,
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="_none">None (Top Level)</SelectItem>
                    {getAvailableParentCategories().map((cat: Categories) => (
                      <SelectItem key={cat.$id} value={cat.$id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Pool Numbers</Label>
                <Input
                  value={formData.poolNumbers}
                  onChange={(e) =>
                    setFormData({ ...formData, poolNumbers: e.target.value })
                  }
                  placeholder="1, 2, 3"
                  disabled={
                    selectedCategory
                      ? hasSubcategories(selectedCategory.$id)
                      : false
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white disabled:opacity-50"
                />
              </div>
              <div>
                <Label className="text-stone-300">Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>

            <div>
              <Label className="text-stone-300">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(v) =>
                  setFormData({ ...formData, isActive: v === 'active' })
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setSelectedCategory(null)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateCategoryMutation.mutate()}
              disabled={updateCategoryMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete "{selectedCategory?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && hasSubcategories(selectedCategory.$id) && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                This category has subcategories. Delete them first before
                deleting this category.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedCategory(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteCategoryMutation.mutate()}
              disabled={
                deleteCategoryMutation.isPending ||
                (selectedCategory
                  ? hasSubcategories(selectedCategory.$id)
                  : false)
              }
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {deleteCategoryMutation.isPending
                ? 'Deleting...'
                : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
