import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  X,
  Loader2,
  TrendingUp,
  Users as UsersIcon,
  Settings,
  Crown,
  Gift,
  GraduationCap,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getCurrentUserProfileFn, listUsersFn } from '@/server/functions/users'
import {
  listPlansFn,
  createPlanFn,
  updatePlanFn,
  deletePlanFn,
} from '@/server/functions/plans'
import type { Plans, Users as UserType } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/plans')({
  loader: async () => {
    const [profileResult, plansResult, usersResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listPlansFn().catch(() => ({ plans: [] })),
      listUsersFn().catch(() => ({ users: [] })),
    ])

    return {
      userProfile: profileResult.user,
      plans: plansResult.plans,
      users: usersResult.users,
    }
  },
  component: PlansPage,
})

function PlansPage() {
  const { userProfile, plans: initialPlans, users } = Route.useLoaderData()
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plans | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Form state for plans
  const [formData, setFormData] = useState({
    name: '',
    planType: 'paid' as 'free' | 'paid',
    targetCategory: 'medical_student' as
      | 'medical_student'
      | 'intern'
      | 'trainee_resident'
      | 'all',
    duration: 'monthly' as 'monthly' | '3months' | '6months',
    durationMonths: 1,
    priceSAR: 0,
    priceUSD: 0,
    description: '',
    isActive: true,
    accessLevel: 'full' as 'full' | 'limited',
    maxQuestions: 0, // 0 = unlimited
    allowedPools: [] as number[],
    features: [] as string[],
  })

  const [newFeature, setNewFeature] = useState('')

  const listPlans = useServerFn(listPlansFn)
  const createPlan = useServerFn(createPlanFn)
  const updatePlan = useServerFn(updatePlanFn)
  const deletePlan = useServerFn(deletePlanFn)

  const { data: plansData } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => listPlans(),
    initialData: { plans: initialPlans },
  })

  const plans = plansData?.plans || []

  // Separate free and paid plans
  const freePlans = plans.filter((p: Plans) => p.planType === 'free')
  const paidPlans = plans.filter((p: Plans) => p.planType === 'paid')

  // Calculate revenue stats - EXCLUDE ADMIN USERS
  const calculateStats = () => {
    // Filter out admin users from all calculations
    const nonAdminUsers = users.filter((u: UserType) => !u.isAdmin)
    const activeUsers = nonAdminUsers.filter((u: UserType) => u.isActive)
    const paidUsers = activeUsers.filter((u: UserType) => u.planType === 'paid')
    const freeUsers = activeUsers.filter((u: UserType) => u.planType === 'free')

    // Calculate revenue by category (excluding admins)
    const revenueByCategory = {
      medical_student: 0,
      intern: 0,
      trainee_resident: 0,
    }

    const usersByCategory = {
      medical_student: 0,
      intern: 0,
      trainee_resident: 0,
    }

    paidUsers.forEach((user: UserType) => {
      const category = user.accessCategory as keyof typeof revenueByCategory
      if (category in revenueByCategory) {
        usersByCategory[category]++
        // Find matching plan for this user's category and duration
        const matchingPlan = paidPlans.find(
          (p: Plans) =>
            (p.targetCategory === category || p.targetCategory === 'all') &&
            p.duration === user.planDuration,
        )
        if (matchingPlan) {
          revenueByCategory[category] += matchingPlan.priceSAR
        }
      }
    })

    const totalRevenueSAR = Object.values(revenueByCategory).reduce(
      (a, b) => a + b,
      0,
    )
    const totalRevenueUSD = Math.round(totalRevenueSAR / 3.75) // Approximate conversion

    // Estimate monthly revenue
    const avgMonthlyPrice =
      paidPlans.length > 0
        ? paidPlans.reduce(
            (sum: number, p: Plans) => sum + p.priceSAR / p.durationMonths,
            0,
          ) / paidPlans.length
        : 0

    const estimatedMonthlyRevenue = paidUsers.length * avgMonthlyPrice

    return {
      totalPlans: plans.length,
      activePlans: plans.filter((p: Plans) => p.isActive).length,
      paidUsers: paidUsers.length,
      freeUsers: freeUsers.length,
      totalUsers: activeUsers.length,
      estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue),
      totalRevenueSAR,
      totalRevenueUSD,
      revenueByCategory,
      usersByCategory,
    }
  }

  const stats = calculateStats()

  const createMutation = useMutation({
    mutationFn: async () => {
      return await createPlan({
        data: {
          name: formData.name.trim(),
          planType: formData.planType,
          targetCategory:
            formData.targetCategory === 'all' ? null : formData.targetCategory,
          duration: formData.duration,
          durationMonths: formData.durationMonths,
          priceSAR: formData.planType === 'free' ? 0 : formData.priceSAR,
          priceUSD: formData.planType === 'free' ? 0 : formData.priceUSD,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          accessLevel: formData.accessLevel,
          maxQuestions: formData.maxQuestions || null,
          allowedPools:
            formData.allowedPools.length > 0 ? formData.allowedPools : null,
          features: formData.features.length > 0 ? formData.features : null,
        },
      })
    },
    onSuccess: () => {
      toast.success('Plan created successfully')
      setShowCreateDialog(false)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create plan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return
      return await updatePlan({
        data: {
          id: selectedPlan.$id,
          name: formData.name.trim(),
          planType: formData.planType,
          targetCategory:
            formData.targetCategory === 'all' ? null : formData.targetCategory,
          duration: formData.duration,
          durationMonths: formData.durationMonths,
          priceSAR: formData.planType === 'free' ? 0 : formData.priceSAR,
          priceUSD: formData.planType === 'free' ? 0 : formData.priceUSD,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          accessLevel: formData.accessLevel,
          maxQuestions: formData.maxQuestions || null,
          allowedPools:
            formData.allowedPools.length > 0 ? formData.allowedPools : null,
          features: formData.features.length > 0 ? formData.features : null,
        },
      })
    },
    onSuccess: () => {
      toast.success('Plan updated successfully')
      setShowEditDialog(false)
      setSelectedPlan(null)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update plan')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return
      return await deletePlan({ data: { id: selectedPlan.$id } })
    },
    onSuccess: () => {
      toast.success('Plan deleted successfully')
      setShowDeleteDialog(false)
      setSelectedPlan(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete plan')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      planType: 'paid',
      targetCategory: 'medical_student',
      duration: 'monthly',
      durationMonths: 1,
      priceSAR: 0,
      priceUSD: 0,
      description: '',
      isActive: true,
      accessLevel: 'full',
      maxQuestions: 0,
      allowedPools: [],
      features: [],
    })
    setNewFeature('')
  }

  const openEditDialog = (plan: Plans) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      planType: (plan.planType as 'free' | 'paid') || 'paid',
      targetCategory:
        (plan.targetCategory as
          | 'medical_student'
          | 'intern'
          | 'trainee_resident'
          | 'all') || 'all',
      duration: plan.duration as 'monthly' | '3months' | '6months',
      durationMonths: plan.durationMonths,
      priceSAR: plan.priceSAR,
      priceUSD: plan.priceUSD,
      description: plan.description || '',
      isActive: plan.isActive,
      accessLevel: (plan.accessLevel as 'full' | 'limited') || 'full',
      maxQuestions: plan.maxQuestions || 0,
      allowedPools: plan.allowedPools || [],
      features: plan.features || [],
    })
    setShowEditDialog(true)
  }

  const openCreateDialog = (planType: 'free' | 'paid') => {
    resetForm()
    setFormData((prev) => ({ ...prev, planType }))
    setShowCreateDialog(true)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case 'monthly':
        return '1 Month'
      case '3months':
        return '3 Months'
      case '6months':
        return '6 Months'
      default:
        return duration
    }
  }

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case 'medical_student':
        return 'Medical Students'
      case 'intern':
        return 'Interns'
      case 'trainee_resident':
        return 'Trainee Residents'
      case 'all':
        return 'All Categories'
      default:
        return 'All Categories'
    }
  }

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'medical_student':
        return <GraduationCap className="w-5 h-5" />
      case 'intern':
        return <Stethoscope className="w-5 h-5" />
      case 'trainee_resident':
        return <UserCheck className="w-5 h-5" />
      default:
        return <UsersIcon className="w-5 h-5" />
    }
  }

  return (
    <AdminLayout userProfile={userProfile}>
      <div className="max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1
              className="text-3xl font-semibold text-white mb-2"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Plans & Revenue
            </h1>
            <p className="text-stone-400">
              Manage subscription plans and track revenue (admin excluded).
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Total Users</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.totalUsers}
            </p>
            <p className="text-xs text-stone-500 mt-1">Excluding admin</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Paid Users</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.paidUsers}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {stats.freeUsers} free users
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Total Revenue</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.totalRevenueSAR} SAR
            </p>
            <p className="text-xs text-stone-500 mt-1">
              ≈ ${stats.totalRevenueUSD} USD
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Est. Monthly</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.estimatedMonthlyRevenue} SAR
            </p>
          </motion.div>
        </div>

        {/* Revenue by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-stone-900 border border-stone-800 p-6 mb-8"
        >
          <h2
            className="text-lg font-semibold text-white mb-4"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Revenue by Category
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Medical Students
                  </p>
                  <p className="text-xs text-stone-400">
                    {stats.usersByCategory.medical_student} users
                  </p>
                </div>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stats.revenueByCategory.medical_student} SAR
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Interns</p>
                  <p className="text-xs text-stone-400">
                    {stats.usersByCategory.intern} users
                  </p>
                </div>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stats.revenueByCategory.intern} SAR
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Trainee Residents
                  </p>
                  <p className="text-xs text-stone-400">
                    {stats.usersByCategory.trainee_resident} users
                  </p>
                </div>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stats.revenueByCategory.trainee_resident} SAR
              </p>
            </div>
          </div>
        </motion.div>

        {/* Plans Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-stone-900 border border-stone-800">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-stone-800"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="free"
              className="data-[state=active]:bg-stone-800"
            >
              <Gift className="w-4 h-4 mr-2" />
              Free Plans
            </TabsTrigger>
            <TabsTrigger
              value="paid"
              className="data-[state=active]:bg-stone-800"
            >
              <Crown className="w-4 h-4 mr-2" />
              Paid Plans
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-800">
                <h2
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: '"Instrument Sans", sans-serif' }}
                >
                  All Plans ({plans.length})
                </h2>
              </div>

              {plans.length > 0 ? (
                <div className="divide-y divide-stone-800">
                  {plans.map((plan: Plans) => (
                    <div
                      key={plan.$id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-800/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            plan.planType === 'free'
                              ? 'bg-stone-700'
                              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                          }`}
                        >
                          {plan.planType === 'free' ? (
                            <Gift className="w-6 h-6 text-stone-400" />
                          ) : (
                            <Crown className="w-6 h-6 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">
                              {plan.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                plan.planType === 'free'
                                  ? 'bg-stone-700 text-stone-300'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {plan.planType === 'free' ? 'Free' : 'Paid'}
                            </span>
                            {plan.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-400">
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(plan.targetCategory)}
                              {getCategoryLabel(plan.targetCategory)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {getDurationLabel(plan.duration)}
                            </span>
                            {plan.planType === 'paid' && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {plan.priceSAR} SAR / {plan.priceUSD} USD
                              </span>
                            )}
                            {plan.accessLevel && (
                              <span className="flex items-center gap-1">
                                <Settings className="w-4 h-4" />
                                {plan.accessLevel === 'full'
                                  ? 'Full Access'
                                  : 'Limited Access'}
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-stone-500 mt-2">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-16 md:ml-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                          className="text-stone-400 hover:text-white hover:bg-stone-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(plan)
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
              ) : (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                  <p className="text-stone-400 mb-2">No plans created yet</p>
                  <p className="text-sm text-stone-500">
                    Create your first subscription plan to get started.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Free Plans Tab */}
          <TabsContent value="free">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h2
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: '"Instrument Sans", sans-serif' }}
                  >
                    Free Plans
                  </h2>
                  <p className="text-sm text-stone-400 mt-1">
                    Configure free tier access for each user category
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog('free')}
                  className="bg-stone-700 hover:bg-stone-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Free Plan
                </Button>
              </div>

              {freePlans.length > 0 ? (
                <div className="divide-y divide-stone-800">
                  {freePlans.map((plan: Plans) => (
                    <div
                      key={plan.$id}
                      className="p-6 hover:bg-stone-800/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center">
                              {getCategoryIcon(plan.targetCategory)}
                            </div>
                            <div>
                              <h3 className="text-white font-medium">
                                {plan.name}
                              </h3>
                              <p className="text-sm text-stone-400">
                                {getCategoryLabel(plan.targetCategory)}
                              </p>
                            </div>
                            {plan.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Access Level
                              </p>
                              <p className="text-sm text-white font-medium">
                                {plan.accessLevel === 'full'
                                  ? 'Full Access'
                                  : 'Limited Access'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Duration
                              </p>
                              <p className="text-sm text-white font-medium">
                                {getDurationLabel(plan.duration)}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Max Questions
                              </p>
                              <p className="text-sm text-white font-medium">
                                {plan.maxQuestions
                                  ? plan.maxQuestions
                                  : 'Unlimited'}
                              </p>
                            </div>
                          </div>

                          {plan.features && plan.features.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-stone-500 mb-2">
                                Features
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {plan.features.map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded-lg text-xs bg-stone-800 text-stone-300"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            className="text-stone-400 hover:text-white hover:bg-stone-800"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setShowDeleteDialog(true)
                            }}
                            className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Gift className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                  <p className="text-stone-400 mb-2">
                    No free plans configured
                  </p>
                  <p className="text-sm text-stone-500 mb-4">
                    Create free plans to define access levels for each user
                    category.
                  </p>
                  <Button
                    onClick={() => openCreateDialog('free')}
                    className="bg-stone-700 hover:bg-stone-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Free Plan
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Paid Plans Tab */}
          <TabsContent value="paid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h2
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: '"Instrument Sans", sans-serif' }}
                  >
                    Paid Plans
                  </h2>
                  <p className="text-sm text-stone-400 mt-1">
                    Configure paid subscription plans with pricing
                  </p>
                </div>
                <Button
                  onClick={() => openCreateDialog('paid')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Paid Plan
                </Button>
              </div>

              {paidPlans.length > 0 ? (
                <div className="divide-y divide-stone-800">
                  {paidPlans.map((plan: Plans) => (
                    <div
                      key={plan.$id}
                      className="p-6 hover:bg-stone-800/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                              <Crown className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">
                                {plan.name}
                              </h3>
                              <p className="text-sm text-stone-400">
                                {getCategoryLabel(plan.targetCategory)}
                              </p>
                            </div>
                            {plan.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Duration
                              </p>
                              <p className="text-sm text-white font-medium">
                                {getDurationLabel(plan.duration)}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Price (SAR)
                              </p>
                              <p className="text-sm text-white font-medium">
                                {plan.priceSAR} SAR
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Price (USD)
                              </p>
                              <p className="text-sm text-white font-medium">
                                ${plan.priceUSD} USD
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-stone-800/50">
                              <p className="text-xs text-stone-500 mb-1">
                                Device Limit
                              </p>
                              <p className="text-sm text-white font-medium">
                                2 Devices
                              </p>
                            </div>
                          </div>

                          {plan.features && plan.features.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-stone-500 mb-2">
                                Features
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {plan.features.map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-400"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            className="text-stone-400 hover:text-white hover:bg-stone-800"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setShowDeleteDialog(true)
                            }}
                            className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Crown className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                  <p className="text-stone-400 mb-2">
                    No paid plans configured
                  </p>
                  <p className="text-sm text-stone-500 mb-4">
                    Create paid plans with pricing for each user category.
                  </p>
                  <Button
                    onClick={() => openCreateDialog('paid')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Paid Plan
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Plan Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setShowEditDialog(false)
            setSelectedPlan(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog
                ? 'Edit Plan'
                : `Create ${formData.planType === 'free' ? 'Free' : 'Paid'} Plan`}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {formData.planType === 'free'
                ? 'Configure free tier access settings for users.'
                : 'Set up a paid subscription plan with pricing.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Plan Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Medical Student Free"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>

              <div>
                <Label className="text-stone-300">Target Category</Label>
                <Select
                  value={formData.targetCategory}
                  onValueChange={(
                    value:
                      | 'medical_student'
                      | 'intern'
                      | 'trainee_resident'
                      | 'all',
                  ) => setFormData({ ...formData, targetCategory: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="medical_student">
                      Medical Students
                    </SelectItem>
                    <SelectItem value="intern">Interns</SelectItem>
                    <SelectItem value="trainee_resident">
                      Trainee Residents
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value: 'monthly' | '3months' | '6months') => {
                    const months =
                      value === 'monthly' ? 1 : value === '3months' ? 3 : 6
                    setFormData({
                      ...formData,
                      duration: value,
                      durationMonths: months,
                    })
                  }}
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="monthly">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-stone-300">Access Level</Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value: 'full' | 'limited') =>
                    setFormData({ ...formData, accessLevel: value })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="limited">Limited Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.planType === 'paid' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-300">Price (SAR)</Label>
                  <Input
                    type="number"
                    value={formData.priceSAR}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceSAR: parseFloat(e.target.value) || 0,
                      })
                    }
                    min={0}
                    step={0.01}
                    className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-stone-300">Price (USD)</Label>
                  <Input
                    type="number"
                    value={formData.priceUSD}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceUSD: parseFloat(e.target.value) || 0,
                      })
                    }
                    min={0}
                    step={0.01}
                    className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                  />
                </div>
              </div>
            )}

            {formData.accessLevel === 'limited' && (
              <div>
                <Label className="text-stone-300">
                  Max Questions (0 = unlimited)
                </Label>
                <Input
                  type="number"
                  value={formData.maxQuestions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxQuestions: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            )}

            <div>
              <Label className="text-stone-300">Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the plan features..."
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
                rows={2}
              />
            </div>

            {/* Features */}
            <div>
              <Label className="text-stone-300">Features</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature..."
                  className="bg-stone-800 border-stone-700 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addFeature}
                  className="bg-stone-700 hover:bg-stone-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-sm bg-stone-800 text-stone-300 flex items-center gap-2"
                    >
                      {feature}
                      <button
                        onClick={() => removeFeature(idx)}
                        className="text-stone-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label className="text-stone-300">Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                setSelectedPlan(null)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                showEditDialog
                  ? updateMutation.mutate()
                  : createMutation.mutate()
              }
              disabled={
                (showEditDialog
                  ? updateMutation.isPending
                  : createMutation.isPending) || !formData.name.trim()
              }
              className={
                formData.planType === 'free'
                  ? 'bg-stone-700 hover:bg-stone-600'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }
            >
              {(
                showEditDialog
                  ? updateMutation.isPending
                  : createMutation.isPending
              ) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {showEditDialog ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete "{selectedPlan?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
