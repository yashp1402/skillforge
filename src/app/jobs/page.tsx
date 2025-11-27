// src/app/jobs/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  title: string;
  company: string | null;
  seniority: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          setUnauthorized(true);
          setError("Please sign in to view your job targets.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load jobs");
        }

        setJobs(data ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Could not load jobs");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  async function handleDelete(id: string) {
    try {
      setError(null);
      const res = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to delete jobs.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete job");
      }

      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not delete job");
    }
  }

  if (unauthorized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Job targets</CardTitle>
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
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Job targets</CardTitle>
          <Button asChild size="sm">
            <Link href="/jobs/new">Add job target</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No job targets yet. Click “Add job target” to create one.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company ?? "Unknown company"}
                      {job.seniority ? ` • ${job.seniority}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="underline"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && !loading && !unauthorized && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
