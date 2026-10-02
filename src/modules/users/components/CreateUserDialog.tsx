"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import type { Role } from "./UsersViewNew"

export function CreateUserDialog({
  open,
  onOpenChange,
  sessionRole,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  sessionRole: Role
  onCreated: () => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<Role>("agent")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPassword(""); setRole("agent")
    }
  }, [open])

  const roleOptions = sessionRole === "super_admin"
    ? [
        { value: "admin", label: "Admin" },
        { value: "agent", label: "Gram Pradhan" },
      ]
    : [{ value: "agent", label: "Gram Pradhan" }]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("All fields are required")
      return
    }
    setBusy(true)
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => null)
        throw new Error(err?.error || "Failed to create user")
      }
      onCreated()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>Create a new account. They can complete their profile after signing in.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Temporary password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
