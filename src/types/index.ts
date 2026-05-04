export interface Member {
  id: string
  name: string
  phone: string
  email: string
  role: string
}

export interface Project {
  id: string
  name: string
  startDate: string
  endDate: string
  description: string
  members: Member[]
}

export interface Task {
  id: string
  wbs: string
  name: string
  startDate: string
  endDate: string
  duration: number
  deliverable: string
  dependencies: string[]
  assignee: string
  priority: string
  status: string
  isMilestone: boolean
  description: string
  parentId: string | null
  children: Task[]
}

export interface DisplaySettings {
  showWBS: boolean
  showName: boolean
  showStartDate: boolean
  showEndDate: boolean
  showDuration: boolean
  showDeliverable: boolean
  showDependencies: boolean
  showAssignee: boolean
  showPriority: boolean
  showStatus: boolean
  showMilestone: boolean
  showDescription: boolean
}

export interface ColorScheme {
  mode: string
  name: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export interface ImportResult {
  project: Project | null
  tasks: Task[]
  success: boolean
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface TaskStatistics {
  total: number
  todo: number
  inProgress: number
  completed: number
  overdue: number
  progress: number
}
