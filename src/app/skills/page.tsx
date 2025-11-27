//src/app/skills/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Skill = {
  id: string;
  name: string;
  level: number;
  category: string | null;
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await fetch("/api/skills");
        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          setUnauthorized(true);
          setError("Please sign in to view your skills.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load skills");
        }

        setSkills(data ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Could not load skills");
      } finally {
        setLoading(false);
      }
    }

    loadSkills();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      name: formData.get("name"),
      level: formData.get("level"),
      category: formData.get("category") || undefined,
    };

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to add skills.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to create skill");
      }

      setSkills((prev) => [...prev, data]);
      form.reset();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      const res = await fetch("/api/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to delete skills.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete skill");
      }

      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not delete skill");
    }
  }


  // If user is logged out, show a simple message instead of full UI
  if (unauthorized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
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

  // normal logged-in UI below
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Skill name</Label>
              <Input id="name" name="name" required placeholder="TypeScript" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level (1–5)</Label>
              <Input
                id="level"
                name="level"
                type="number"
                min={1}
                max={5}
                defaultValue={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="Backend, Frontend, DevOps…"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 md:col-span-3">{error}</p>
            )}

            <div className="md:col-span-3">
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add skill"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your skills</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading skills…</p>
          ) : skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No skills yet. Add your first one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {skill.level}
                      {skill.category ? ` • ${skill.category}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
