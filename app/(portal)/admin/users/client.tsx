'use client'

import { useState } from 'react'
import { inviteUser, updateUserRole, deleteUser } from './actions'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserPlus, ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'
import { timeAgo } from '@/lib/types'

interface AdminUsersClientProps {
  users: Profile[]
  currentUserId: string
}

export function AdminUsersClient({ users, currentUserId }: AdminUsersClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'super_admin'>('admin')
  const [loading, setLoading] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setLoading(true)
    const result = await inviteUser(inviteEmail, inviteRole)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invitation sent')
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('admin')
    }
    setLoading(false)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const result = await updateUserRole(userId, newRole)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated')
    }
  }

  async function handleDelete() {
    if (!userToDelete) return
    const result = await deleteUser(userToDelete)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('User deleted')
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite users and manage roles across the portal.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
              <UserPlus className="h-4 w-4" />
              Invite User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@beyondborders.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor (Can create/edit own content)</SelectItem>
                    <SelectItem value="admin">Admin (Can edit any content)</SelectItem>
                    <SelectItem value="super_admin">Super Admin (Can manage users)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <div className="w-[300px]">User</div>
            <div className="w-[150px]">Role</div>
            <div className="flex-1">Joined</div>
            <div className="w-[100px] text-right">Actions</div>
          </div>
        </div>
        <div className="divide-y">
          {users.map((user) => {
            const initials = user.display_name.slice(0, 2).toUpperCase()
            const isMe = user.id === currentUserId
            
            return (
              <div key={user.id} className="flex items-center p-4">
                <div className="w-[300px] flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      {user.display_name}
                      {isMe && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <div className="w-[150px]">
                  <Select
                    defaultValue={user.role}
                    onValueChange={(v) => v && handleRoleChange(user.id, v)}
                    disabled={isMe}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin" className="text-destructive focus:text-destructive">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-3 w-3" />
                          Super Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 text-sm text-muted-foreground">
                  {timeAgo(user.created_at)}
                </div>

                <div className="w-[100px] text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setUserToDelete(user.id)}
                    disabled={isMe}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete the user account and remove their access to the portal.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
