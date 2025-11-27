// src/app/jobs/[id]/RequiredSkillsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  jobId: string;
};

export default function RequiredSkillsClient({ jobId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      jobId, // 👈 MUST be included in the body
      name: formData.get("name"),
      importance: formData.get("importance"),
    };

    try {
      // Optional: debug in console
      // console.log("Sending body:", body);

      const res = await fetch("/api/job-required-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to add required skill");
      }

      form.reset();
      router.refresh(); // reload server component to show updated gap
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add required skill</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Skill name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="TypeScript, React, System Design..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importance">Required level (1–5)</Label>
            <Input
              id="importance"
              name="importance"
              type="number"
              min={1}
              max={5}
              defaultValue={3}
              required
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500 md:col-span-3">{error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
