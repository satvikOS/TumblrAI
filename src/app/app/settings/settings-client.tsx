"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type User = { id: string; name: string; email: string; tier: string };

export function SettingsClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState(currentUserId);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((j: { available: User[] }) => setUsers(j.available));
  }, []);

  async function switchUser() {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected }),
    });
    if (r.ok) {
      toast.success("Switched account");
      setTimeout(() => window.location.reload(), 300);
    }
  }

  return (
    <div className="border-t border-border pt-3">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        Switch mock user
      </div>
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} · {u.tier}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={switchUser} disabled={selected === currentUserId}>Switch</Button>
      </div>
    </div>
  );
}
