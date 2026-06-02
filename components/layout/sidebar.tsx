'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { APP_SHORT_NAME } from '@/lib/constants'
import {
  LayoutDashboard,
  Rss,
  Newspaper,
  GraduationCap,
  Briefcase,
  Globe,
  Image as ImageIcon,
  Activity,
  Shield,
  Settings,
} from 'lucide-react'

interface SidebarProps {
  userRole: string
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feed', label: 'All Updates', icon: Rss },
  { href: '/news', label: 'Visa News', icon: Newspaper },
  { href: '/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/work', label: 'Work Opportunities', icon: Briefcase },
  { href: '/countries', label: 'Countries', icon: Globe },
  { href: '/media', label: 'Media Library', icon: ImageIcon },
  { href: '/activity', label: 'Activity', icon: Activity },
]

const adminItems = [
  { href: '/admin/users', label: 'Admin', icon: Shield },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center shrink-0">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" priority />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground truncate">
          {APP_SHORT_NAME}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}

          {/* Super admin only */}
          {userRole === 'super_admin' && (
            <>
              <div className="my-3 border-t border-border" />
              {adminItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
