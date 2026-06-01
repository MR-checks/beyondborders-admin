'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentForm } from '@/components/content/content-form'
import { contentTypeConfigs } from '@/lib/content-types'
import type { Country } from '@/lib/types'
import { Newspaper, GraduationCap, Briefcase, Bell, FileText } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Newspaper,
  GraduationCap,
  Briefcase,
  Bell,
  FileText,
}

interface CreateFlowProps {
  countries: Country[]
}

export function CreateFlow({ countries }: CreateFlowProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  if (selectedType) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedType(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to type selection
        </button>
        <h1 className="text-2xl font-bold tracking-tight">
          Create {contentTypeConfigs[selectedType]?.label}
        </h1>
        <ContentForm type={selectedType} countries={countries} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a content type to get started
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(contentTypeConfigs).map((config) => {
          const Icon = iconMap[config.icon] ?? FileText
          return (
            <Card
              key={config.type}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
              onClick={() => setSelectedType(config.type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-base">{config.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {config.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
