// src/app/goals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type GoalStatus = "PLANNED" | "IN_PROGRESS" | "DONE";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
};

function statusStyles(status: GoalStatus): { label: string; className: string } {
  switch (status) {
    case "PLANNED":
      return {
        label: "Planned",
        className: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "IN_PROGRESS":
      return {
        label: "In progress",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "DONE":
      return {
        label: "Done",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadGoals() {
      try {
        const res = await fetch("/api/goals");
        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          setUnauthorized(true);
          setError("Please sign in to view your goals.");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error(data?.error ?? "Failed to load goals");
        setGoals(data ?? []);
      } catch (err: any) {
        setError(err.message ?? "Could not load goals");
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      title: formData.get("title"),
      description: formData.get("description"),
    };

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to add goals.");
        return;
      }

      if (!res.ok) throw new Error(data?.error ?? "Failed to create goal");
      setGoals((prev) => [data, ...prev]);
      form.reset();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: GoalStatus) {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to update goals.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update status");
      }

      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status } : g))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not update status");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      const res = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to delete goals.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete goal");
      }

      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not delete goal");
    }
  }

  if (unauthorized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              className="mt-3"
              onClick={() => router.push("/auth/sign-in")}
            >
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New learning goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Build a full-stack Next.js project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="More detail on what you want to learn..."
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Saving..." : "Save goal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your goals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading goals…</p>
          ) : goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No learning goals yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {goals.map((g) => {
                const styles = statusStyles(g.status);
                return (
                  <li
                    key={g.id}
                    className="rounded-md border px-3 py-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{g.title}</p>
                      {g.description && (
                        <p className="text-xs text-muted-foreground">
                          {g.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles.className}`}
                      >
                        {styles.label}
                      </span>
                      <select
                        className="rounded-md border px-2 py-1 text-xs bg-background"
                        value={g.status}
                        onChange={(e) =>
                          handleStatusChange(
                            g.id,
                            e.target.value as GoalStatus
                          )
                        }
                      >
                        <option value="PLANNED">Planned</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
