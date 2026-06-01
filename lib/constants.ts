export const APP_NAME = 'BeyondBorders Admin Portal'
export const APP_SHORT_NAME = 'BeyondBorders'

export const CONTENT_TYPES = {
  visa_news: { label: 'Visa News', icon: 'Newspaper', color: 'text-blue-500' },
  scholarship: { label: 'Scholarship', icon: 'GraduationCap', color: 'text-purple-500' },
  work_opportunity: { label: 'Work Opportunity', icon: 'Briefcase', color: 'text-emerald-500' },
  update: { label: 'Update', icon: 'Bell', color: 'text-amber-500' },
  resource: { label: 'Resource', icon: 'FileText', color: 'text-slate-500' },
} as const

export type ContentTypeKey = keyof typeof CONTENT_TYPES

export const REACTION_EMOJIS = ['👍', '✅', '⚠️', '🔥'] as const

export const STATUS_COLORS = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  closing_soon: { label: 'Closing Soon', className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  expired: { label: 'Expired', className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20' },
  draft: { label: 'Draft', className: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20' },
} as const

export type ComputedStatus = keyof typeof STATUS_COLORS

export const ITEMS_PER_PAGE = 20
