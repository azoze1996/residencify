import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Smartphone,
  RotateCcw,
  ClipboardList,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  getCurrentUserProfileFn,
  listUsersFn,
  createUserFn,
  updateUserFn,
  deleteUserFn,
  resetUserDevicesFn,
} from '@/server/functions/users'
import type { Users as UsersType } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/users')({
  loader: async () => {
    const [profileResult, usersResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listUsersFn().catch(() => ({ users: [] })),
    ])

    return {
      userProfile: profileResult.user,
      users: usersResult.users,
    }
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { userProfile, users: initialUsers } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDevicesDialog, setShowResetDevicesDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)
  const [filterRole, setFilterRole] = useState<
    'all' | 'user' | 'exam_admin' | 'admin'
  >('all')

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    planType: 'free' as 'free' | 'paid',
    planDuration: 'monthly' as 'monthly' | '3months' | '6months',
    accessCategory: 'trainee_resident' as const,
    isActive: true,
    isExamAdmin: false,
  })

  const listUsers = useServerFn(listUsersFn)
  const createUser = useServerFn(createUserFn)
  const updateUser = useServerFn(updateUserFn)
  const deleteUser = useServerFn(deleteUserFn)
  const resetUserDevices = useServerFn(resetUserDevicesFn)

  const { data: usersData, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listUsers(),
    initialData: { users: initialUsers },
  })

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const now = new Date()
      const endDate = new Date(now)

      switch (formData.planDuration) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1)
          break
        case '3months':
          endDate.setMonth(endDate.getMonth() + 3)
          break
        case '6months':
          endDate.setMonth(endDate.getMonth() + 6)
          break
      }

      return await createUser({
        data: {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          planType: formData.planType,
          planDuration: formData.planDuration,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          accessCategory: formData.accessCategory,
          isActive: formData.isActive,
          isExamAdmin: formData.isExamAdmin,
        },
      })
    },
    onSuccess: () => {
      toast.success('User created successfully')
      setShowCreateDialog(false)
      resetForm()
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return

      let endDate: string | undefined
      if (formData.planDuration) {
        const start = new Date(selectedUser.startDate)
        switch (formData.planDuration) {
          case 'monthly':
            start.setMonth(start.getMonth() + 1)
            break
          case '3months':
            start.setMonth(start.getMonth() + 3)
            break
          case '6months':
            start.setMonth(start.getMonth() + 6)
            break
        }
        endDate = start.toISOString()
      }

      return await updateUser({
        data: {
          id: selectedUser.$id,
          username: formData.username || undefined,
          email: formData.email || undefined,
          planType: formData.planType,
          planDuration: formData.planDuration,
          endDate,
          accessCategory: formData.accessCategory,
          isActive: formData.isActive,
          isExamAdmin: formData.isExamAdmin,
        },
      })
    },
    onSuccess: () => {
      toast.success('User updated successfully')
      setShowEditDialog(false)
      setSelectedUser(null)
      resetForm()
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return
      return await deleteUser({ data: { id: selectedUser.$id } })
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
      setSelectedUser(null)
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })

  const resetDevicesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return
      return await resetUserDevices({ data: { userId: selectedUser.$id } })
    },
    onSuccess: () => {
      toast.success('User devices reset successfully')
      setShowResetDevicesDialog(false)
      setSelectedUser(null)
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset devices')
    },
  })

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      planType: 'free',
      planDuration: 'monthly',
      accessCategory: 'trainee_resident',
      isActive: true,
      isExamAdmin: false,
    })
  }

  const openEditDialog = (user: UsersType) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      planType: user.planType as 'free' | 'paid',
      planDuration: user.planDuration as 'monthly' | '3months' | '6months',
      accessCategory: 'trainee_resident',
      isActive: user.isActive,
      isExamAdmin: user.accessLevel === 'exam_admin',
    })
    setShowEditDialog(true)
  }

  const filteredUsers = usersData.users.filter((user: UsersType) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filterRole === 'all') return true
    if (filterRole === 'admin') return user.isAdmin
    if (filterRole === 'exam_admin') return user.accessLevel === 'exam_admin'
    if (filterRole === 'user')
      return !user.isAdmin && user.accessLevel !== 'exam_admin'

    return true
  })

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'trainee_resident':
        return 'Trainee Resident'
      default:
        return category
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <AdminLayout userProfile={userProfile}>
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
              Users Management
            </h1>
            <p className="text-stone-400">
              Manage user accounts and subscriptions.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-10 bg-stone-900 border-stone-800 text-white placeholder:text-stone-500"
            />
          </div>
          <Select
            value={filterRole}
            onValueChange={(v) => setFilterRole(v as typeof filterRole)}
          >
            <SelectTrigger className="w-[180px] bg-stone-900 border-stone-800 text-white">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-stone-800 border-stone-700">
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
              <SelectItem value="exam_admin">Exam Admins</SelectItem>
              <SelectItem value="admin">Full Admins</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    User
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Role
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Category
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Plan
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Devices
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Expires
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-stone-400">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-stone-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: UsersType) => (
                  <tr
                    key={user.$id}
                    className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.isAdmin
                              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600'
                              : user.accessLevel === 'exam_admin'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                          }`}
                        >
                          {user.isAdmin ? (
                            <Shield className="w-5 h-5 text-white" />
                          ) : user.accessLevel === 'exam_admin' ? (
                            <ClipboardList className="w-5 h-5 text-white" />
                          ) : (
                            <Users className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            {user.username}
                          </p>
                          <p className="text-xs text-stone-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {user.isAdmin && (
                          <span className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400 w-fit">
                            Full Admin
                          </span>
                        )}
                        {user.accessLevel === 'exam_admin' && (
                          <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 w-fit">
                            Exam Admin
                          </span>
                        )}
                        {!user.isAdmin && user.accessLevel !== 'exam_admin' && (
                          <span className="px-2 py-0.5 rounded text-xs bg-stone-700 text-stone-300 w-fit">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-stone-300">
                        {getCategoryLabel(user.accessCategory)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          user.planType === 'paid'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-stone-700 text-stone-300'
                        }`}
                      >
                        {user.planType === 'paid' ? 'Paid' : 'Free'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.planType === 'paid' && !user.isAdmin ? (
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-stone-400" />
                          <span className="text-sm text-stone-300">
                            {user.deviceIds?.length || 0}/2
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-stone-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-stone-300">
                        {formatDate(user.endDate)}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-sm">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.planType === 'paid' &&
                          !user.isAdmin &&
                          (user.deviceIds?.length || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowResetDevicesDialog(true)
                              }}
                              className="text-stone-400 hover:text-amber-400 hover:bg-amber-500/10"
                              title="Reset devices"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="text-stone-400 hover:text-white hover:bg-stone-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteDialog(true)
                          }}
                          className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                          disabled={user.isAdmin}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">No users found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription className="text-stone-400">
              Add a new user to the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="johndoe"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Min 8 characters"
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Plan Type</Label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, planType: v as 'free' | 'paid' })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-stone-300">Duration</Label>
                <Select
                  value={formData.planDuration}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      planDuration: v as 'monthly' | '3months' | '6months',
                    })
                  }
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
            </div>

            {/* Exam Admin Toggle */}
            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <div>
                  <Label className="text-stone-300">Exam Admin Access</Label>
                  <p className="text-xs text-stone-500">
                    Grant exam admin privileges (can manage questions,
                    categories, but not users/plans)
                  </p>
                </div>
              </div>
              <Select
                value={formData.isExamAdmin ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setFormData({ ...formData, isExamAdmin: v === 'yes' })
                }
              >
                <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="no">No - Regular User</SelectItem>
                  <SelectItem value="yes">Yes - Exam Admin</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={() => createUserMutation.mutate()}
              disabled={
                createUserMutation.isPending ||
                !formData.username ||
                !formData.email ||
                !formData.password
              }
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-stone-400">
              Update user information and subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Plan Type</Label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, planType: v as 'free' | 'paid' })
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-stone-300">Duration</Label>
                <Select
                  value={formData.planDuration}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      planDuration: v as 'monthly' | '3months' | '6months',
                    })
                  }
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

            {/* Exam Admin Toggle */}
            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <div>
                  <Label className="text-stone-300">Exam Admin Access</Label>
                  <p className="text-xs text-stone-500">
                    Grant exam admin privileges (can manage questions,
                    categories, but not users/plans)
                  </p>
                </div>
              </div>
              <Select
                value={formData.isExamAdmin ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setFormData({ ...formData, isExamAdmin: v === 'yes' })
                }
              >
                <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="no">No - Regular User</SelectItem>
                  <SelectItem value="yes">Yes - Exam Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setSelectedUser(null)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateUserMutation.mutate()}
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete {selectedUser?.username}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedUser(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Devices Confirmation Dialog */}
      <Dialog
        open={showResetDevicesDialog}
        onOpenChange={setShowResetDevicesDialog}
      >
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-400" />
              Reset User Devices
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to reset devices for{' '}
              {selectedUser?.username}? This will allow them to register new
              devices.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
              <p className="text-sm text-stone-300">
                <strong>Current devices:</strong>{' '}
                {selectedUser?.deviceIds?.length || 0}/2
              </p>
              <p className="text-xs text-stone-500 mt-2">
                After reset, the user will need to log in again on their
                devices.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDevicesDialog(false)
                setSelectedUser(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => resetDevicesMutation.mutate()}
              disabled={resetDevicesMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {resetDevicesMutation.isPending
                ? 'Resetting...'
                : 'Reset Devices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
