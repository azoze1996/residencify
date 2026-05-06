import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Stethoscope,
  FileText,
  X,
  MessageSquare,
  Image,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
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
import { Loader } from '@/components/common/Loader'
import { getCurrentUserProfileFn, isAdminFn } from '@/server/functions/users'
import {
  listAllOsceSpecialtiesFn,
  listAllOsceTopicsFn,
  createOsceSpecialtyFn,
  updateOsceSpecialtyFn,
  deleteOsceSpecialtyFn,
  createOsceTopicFn,
  updateOsceTopicFn,
  deleteOsceTopicFn,
} from '@/server/functions/osce'
import type { OsceTopics, OsceSpecialties } from '@/server/lib/appwrite.types'

interface Interaction {
  text: string
  reply: string
}

export const Route = createFileRoute('/_protected/admin/osce')({
  loader: async () => {
    const [profileResult, adminCheck, specialtiesResult, topicsResult] =
      await Promise.all([
        getCurrentUserProfileFn(),
        isAdminFn(),
        listAllOsceSpecialtiesFn().catch(() => ({ specialties: [] })),
        listAllOsceTopicsFn().catch(() => ({ topics: [] })),
      ])

    return {
      userProfile: profileResult.user,
      isExamAdmin: adminCheck.isExamAdmin && !adminCheck.isAdmin,
      specialties: specialtiesResult.specialties,
      topics: topicsResult.topics,
    }
  },
  component: OsceManagementPage,
})

function OsceManagementPage() {
  const { userProfile, isExamAdmin, specialties, topics } =
    Route.useLoaderData()

  const [activeTab, setActiveTab] = useState<'specialties' | 'topics'>(
    'specialties',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<
    string | null
  >(null)

  // Specialty state
  const [showSpecialtyDialog, setShowSpecialtyDialog] = useState(false)
  const [editingSpecialty, setEditingSpecialty] =
    useState<OsceSpecialties | null>(null)
  const [specialtyForm, setSpecialtyForm] = useState({
    name: '',
    description: '',
    order: 0,
    isActive: true,
  })

  // Topic state
  const [showTopicDialog, setShowTopicDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<OsceTopics | null>(null)
  const [topicForm, setTopicForm] = useState({
    title: '',
    specialty: '',
    scenario: '',
    scenarioImageUrl: '',
    interactions: [] as Interaction[],
    order: 0,
    isActive: true,
  })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'specialty' | 'topic'
    id: string
    name: string
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Server functions
  const createSpecialty = useServerFn(createOsceSpecialtyFn)
  const updateSpecialty = useServerFn(updateOsceSpecialtyFn)
  const deleteSpecialty = useServerFn(deleteOsceSpecialtyFn)
  const createTopic = useServerFn(createOsceTopicFn)
  const updateTopic = useServerFn(updateOsceTopicFn)
  const deleteTopic = useServerFn(deleteOsceTopicFn)

  // Filter specialties
  const filteredSpecialties = specialties.filter((s: OsceSpecialties) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter topics
  const filteredTopics = topics.filter((t: OsceTopics) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpecialty = selectedSpecialtyFilter
      ? t.specialty === selectedSpecialtyFilter
      : true
    return matchesSearch && matchesSpecialty
  })

  // Get topic count per specialty
  const getTopicCount = (specialtyName: string) => {
    return topics.filter((t: OsceTopics) => t.specialty === specialtyName)
      .length
  }

  // ============ Specialty Handlers ============

  const openSpecialtyDialog = (specialty?: OsceSpecialties) => {
    if (specialty) {
      setEditingSpecialty(specialty)
      setSpecialtyForm({
        name: specialty.name,
        description: specialty.description || '',
        order: specialty.order || 0,
        isActive: specialty.isActive,
      })
    } else {
      setEditingSpecialty(null)
      setSpecialtyForm({
        name: '',
        description: '',
        order: specialties.length,
        isActive: true,
      })
    }
    setShowSpecialtyDialog(true)
  }

  const handleSpecialtySubmit = async () => {
    if (!specialtyForm.name.trim()) {
      toast.error('Specialty name is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingSpecialty) {
        await updateSpecialty({
          data: {
            id: editingSpecialty.$id,
            name: specialtyForm.name,
            description: specialtyForm.description || null,
            order: specialtyForm.order,
            isActive: specialtyForm.isActive,
          },
        })
        toast.success('Specialty updated successfully')
      } else {
        await createSpecialty({
          data: {
            name: specialtyForm.name,
            description: specialtyForm.description || null,
            order: specialtyForm.order,
            isActive: specialtyForm.isActive,
          },
        })
        toast.success('Specialty created successfully')
      }
      setShowSpecialtyDialog(false)
      window.location.reload()
    } catch {
      toast.error('Failed to save specialty')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============ Topic Handlers ============

  const openTopicDialog = (topic?: OsceTopics) => {
    if (topic) {
      setEditingTopic(topic)
      let interactions: Interaction[] = []
      try {
        if (topic.interactions) {
          interactions = JSON.parse(topic.interactions)
        }
      } catch {
        interactions = []
      }
      setTopicForm({
        title: topic.title,
        specialty: topic.specialty,
        scenario: topic.scenario,
        scenarioImageUrl: topic.scenarioImageUrl || '',
        interactions,
        order: topic.order || 0,
        isActive: topic.isActive,
      })
    } else {
      setEditingTopic(null)
      setTopicForm({
        title: '',
        specialty: specialties[0]?.name || '',
        scenario: '',
        scenarioImageUrl: '',
        interactions: [{ text: '', reply: '' }],
        order: topics.length,
        isActive: true,
      })
    }
    setShowTopicDialog(true)
  }

  const handleTopicSubmit = async () => {
    if (!topicForm.title.trim()) {
      toast.error('Topic title is required')
      return
    }
    if (!topicForm.specialty) {
      toast.error('Specialty is required')
      return
    }
    if (!topicForm.scenario.trim()) {
      toast.error('Scenario is required')
      return
    }

    // Filter out empty interactions
    const validInteractions = topicForm.interactions.filter(
      (i) => i.text.trim() && i.reply.trim(),
    )

    setIsSubmitting(true)
    try {
      if (editingTopic) {
        await updateTopic({
          data: {
            id: editingTopic.$id,
            title: topicForm.title,
            specialty: topicForm.specialty,
            scenario: topicForm.scenario,
            scenarioImageUrl: topicForm.scenarioImageUrl || null,
            interactions:
              validInteractions.length > 0 ? validInteractions : null,
            order: topicForm.order,
            isActive: topicForm.isActive,
          },
        })
        toast.success('Topic updated successfully')
      } else {
        await createTopic({
          data: {
            title: topicForm.title,
            specialty: topicForm.specialty,
            scenario: topicForm.scenario,
            scenarioImageUrl: topicForm.scenarioImageUrl || null,
            interactions:
              validInteractions.length > 0 ? validInteractions : null,
            order: topicForm.order,
            isActive: topicForm.isActive,
          },
        })
        toast.success('Topic created successfully')
      }
      setShowTopicDialog(false)
      window.location.reload()
    } catch {
      toast.error('Failed to save topic')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============ Delete Handlers ============

  const handleDelete = async () => {
    if (!deleteConfirm) return

    setIsSubmitting(true)
    try {
      if (deleteConfirm.type === 'specialty') {
        await deleteSpecialty({ data: { id: deleteConfirm.id } })
        toast.success('Specialty deleted successfully')
      } else {
        await deleteTopic({ data: { id: deleteConfirm.id } })
        toast.success('Topic deleted successfully')
      }
      setDeleteConfirm(null)
      window.location.reload()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============ Interaction Handlers ============

  const addInteraction = () => {
    setTopicForm((prev) => ({
      ...prev,
      interactions: [...prev.interactions, { text: '', reply: '' }],
    }))
  }

  const removeInteraction = (index: number) => {
    setTopicForm((prev) => ({
      ...prev,
      interactions: prev.interactions.filter((_, i) => i !== index),
    }))
  }

  const updateInteraction = (
    index: number,
    field: 'text' | 'reply',
    value: string,
  ) => {
    setTopicForm((prev) => ({
      ...prev,
      interactions: prev.interactions.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  return (
    <AdminLayout userProfile={userProfile} isExamAdmin={isExamAdmin}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              OSCE Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage OSCE specialties and clinical scenarios
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'specialties' | 'topics')}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger
                value="specialties"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Specialties ({specialties.length})
              </TabsTrigger>
              <TabsTrigger
                value="topics"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                Topics ({topics.length})
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() =>
                activeTab === 'specialties'
                  ? openSpecialtyDialog()
                  : openTopicDialog()
              }
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'specialties' ? 'Specialty' : 'Topic'}
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            {activeTab === 'topics' && (
              <Select
                value={selectedSpecialtyFilter || 'all'}
                onValueChange={(v) =>
                  setSelectedSpecialtyFilter(v === 'all' ? null : v)
                }
              >
                <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((s: OsceSpecialties) => (
                    <SelectItem key={s.$id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Specialties Tab */}
          <TabsContent value="specialties" className="mt-0">
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {filteredSpecialties.map(
                  (specialty: OsceSpecialties, index: number) => (
                    <motion.div
                      key={specialty.$id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Stethoscope className="w-4 h-4 text-slate-400" />
                            <h3 className="font-medium text-white truncate">
                              {specialty.name}
                            </h3>
                            {!specialty.isActive && (
                              <Badge
                                variant="secondary"
                                className="bg-slate-700 text-slate-300"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {specialty.description && (
                            <p className="text-sm text-slate-400 line-clamp-2">
                              {specialty.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{getTopicCount(specialty.name)} topics</span>
                            <span>Order: {specialty.order ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSpecialtyDialog(specialty)}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'specialty',
                                id: specialty.$id,
                                name: specialty.name,
                              })
                            }
                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ),
                )}
              </AnimatePresence>

              {filteredSpecialties.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchQuery
                    ? 'No specialties match your search'
                    : 'No specialties yet. Create your first one!'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="mt-0">
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {filteredTopics.map((topic: OsceTopics, index: number) => (
                  <motion.div
                    key={topic.$id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <h3 className="font-medium text-white truncate">
                            {topic.title}
                          </h3>
                          {!topic.isActive && (
                            <Badge
                              variant="secondary"
                              className="bg-slate-700 text-slate-300"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {topic.scenario}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <Badge
                            variant="outline"
                            className="border-slate-600 text-slate-400"
                          >
                            {topic.specialty}
                          </Badge>
                          {topic.interactions && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {JSON.parse(topic.interactions).length}{' '}
                              interactions
                            </span>
                          )}
                          {topic.scenarioImageUrl && (
                            <span className="flex items-center gap-1">
                              <Image className="w-3 h-3" />
                              Has image
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTopicDialog(topic)}
                          className="text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'topic',
                              id: topic.$id,
                              name: topic.title,
                            })
                          }
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTopics.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchQuery || selectedSpecialtyFilter
                    ? 'No topics match your filters'
                    : 'No topics yet. Create your first one!'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Specialty Dialog */}
      <Dialog open={showSpecialtyDialog} onOpenChange={setShowSpecialtyDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSpecialty ? 'Edit Specialty' : 'Add Specialty'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={specialtyForm.name}
                onChange={(e) =>
                  setSpecialtyForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g., Internal Medicine"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={specialtyForm.description}
                onChange={(e) =>
                  setSpecialtyForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this specialty..."
                className="bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={specialtyForm.order}
                  onChange={(e) =>
                    setSpecialtyForm((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={specialtyForm.isActive}
                    onCheckedChange={(checked) =>
                      setSpecialtyForm((prev) => ({
                        ...prev,
                        isActive: checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-400">
                    {specialtyForm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSpecialtyDialog(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSpecialtySubmit}
              disabled={isSubmitting}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              {isSubmitting ? (
                <Loader size="sm" />
              ) : editingSpecialty ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? 'Edit Topic' : 'Add Topic'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={topicForm.title}
                  onChange={(e) =>
                    setTopicForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Chest Pain Assessment"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Specialty *</Label>
                <Select
                  value={topicForm.specialty}
                  onValueChange={(v) =>
                    setTopicForm((prev) => ({ ...prev, specialty: v }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s: OsceSpecialties) => (
                      <SelectItem key={s.$id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scenario *</Label>
              <Textarea
                value={topicForm.scenario}
                onChange={(e) =>
                  setTopicForm((prev) => ({
                    ...prev,
                    scenario: e.target.value,
                  }))
                }
                placeholder="Describe the clinical scenario..."
                className="bg-slate-800 border-slate-700 min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Scenario Image URL (optional)</Label>
              <Input
                value={topicForm.scenarioImageUrl}
                onChange={(e) =>
                  setTopicForm((prev) => ({
                    ...prev,
                    scenarioImageUrl: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {/* Interactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Interactions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInteraction}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {topicForm.interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Interaction {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInteraction(index)}
                        className="h-6 w-6 text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={interaction.text}
                      onChange={(e) =>
                        updateInteraction(index, 'text', e.target.value)
                      }
                      placeholder="Question/Action (e.g., 'What brings you in today?')"
                      className="bg-slate-900 border-slate-600 text-sm"
                    />
                    <Textarea
                      value={interaction.reply}
                      onChange={(e) =>
                        updateInteraction(index, 'reply', e.target.value)
                      }
                      placeholder="Patient response..."
                      className="bg-slate-900 border-slate-600 text-sm min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={topicForm.order}
                  onChange={(e) =>
                    setTopicForm((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={topicForm.isActive}
                    onCheckedChange={(checked) =>
                      setTopicForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-sm text-slate-400">
                    {topicForm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTopicDialog(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopicSubmit}
              disabled={isSubmitting}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              {isSubmitting ? (
                <Loader size="sm" />
              ) : editingTopic ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-medium text-white">
              "{deleteConfirm?.name}"
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isSubmitting ? <Loader size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
