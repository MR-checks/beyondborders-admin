export type FieldType = 'text' | 'select' | 'boolean' | 'date' | 'multiselect'

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  /** If true, this field maps to a top-level column (e.g. end_date) instead of details JSONB */
  topLevel?: boolean
  topLevelColumn?: string
}

export interface ContentTypeConfig {
  type: string
  label: string
  description: string
  icon: string
  fields: FieldConfig[]
}

export const contentTypeConfigs: Record<string, ContentTypeConfig> = {
  visa_news: {
    type: 'visa_news',
    label: 'Visa News',
    description: 'Immigration policy updates, visa rule changes, and regulatory news',
    icon: 'Newspaper',
    fields: [
      {
        name: 'urgency_level',
        label: 'Urgency Level',
        type: 'select',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
      {
        name: 'affected_visa_types',
        label: 'Affected Visa Types',
        type: 'multiselect',
        options: [
          { label: 'Study', value: 'study' },
          { label: 'Work', value: 'work' },
          { label: 'Tourist', value: 'tourist' },
          { label: 'Medical', value: 'medical' },
        ],
      },
      {
        name: 'published_date',
        label: 'Published Date',
        type: 'date',
      },
    ],
  },

  scholarship: {
    type: 'scholarship',
    label: 'Scholarship',
    description: 'Scholarships, grants, and financial aid opportunities',
    icon: 'GraduationCap',
    fields: [
      {
        name: 'university',
        label: 'University / Institution',
        type: 'text',
        placeholder: 'e.g. University of Toronto',
      },
      {
        name: 'degree_level',
        label: 'Degree Level',
        type: 'select',
        options: [
          { label: 'Bachelor', value: 'bachelor' },
          { label: 'Master', value: 'master' },
          { label: 'PhD', value: 'phd' },
          { label: 'Postdoc', value: 'postdoc' },
          { label: 'Any', value: 'any' },
        ],
      },
      {
        name: 'funding_type',
        label: 'Funding Type',
        type: 'select',
        options: [
          { label: 'Full', value: 'full' },
          { label: 'Partial', value: 'partial' },
          { label: 'Stipend', value: 'stipend' },
        ],
      },
      {
        name: 'end_date',
        label: 'Deadline',
        type: 'date',
        topLevel: true,
        topLevelColumn: 'end_date',
      },
    ],
  },

  work_opportunity: {
    type: 'work_opportunity',
    label: 'Work Opportunity',
    description: 'Job openings, internships, and career opportunities abroad',
    icon: 'Briefcase',
    fields: [
      {
        name: 'company',
        label: 'Company',
        type: 'text',
        placeholder: 'e.g. Google',
      },
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        placeholder: 'e.g. Technology',
      },
      {
        name: 'salary',
        label: 'Salary',
        type: 'text',
        placeholder: 'e.g. $80,000/year',
      },
      {
        name: 'visa_sponsorship',
        label: 'Visa Sponsorship',
        type: 'boolean',
      },
      {
        name: 'remote',
        label: 'Remote Work',
        type: 'boolean',
      },
      {
        name: 'end_date',
        label: 'Deadline',
        type: 'date',
        topLevel: true,
        topLevelColumn: 'end_date',
      },
    ],
  },

  update: {
    type: 'update',
    label: 'Update',
    description: 'General updates, announcements, and team communications',
    icon: 'Bell',
    fields: [],
  },

  resource: {
    type: 'resource',
    label: 'Resource',
    description: 'Guides, documents, checklists, and reference materials',
    icon: 'FileText',
    fields: [],
  },
}
