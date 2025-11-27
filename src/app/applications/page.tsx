// src/app/applications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AppStatus =
  | "APPLIED"
  | "ONLINE_ASSESSMENT"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

type Application = {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  appliedAt: string;
  link: string | null;
  notes: string | null;
};

function appStatusStyles(
  status: AppStatus
): { label: string; className: string } {
  switch (status) {
    case "APPLIED":
      return {
        label: "Applied",
        className: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "ONLINE_ASSESSMENT":
      return {
        label: "Online assessment",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case "INTERVIEW":
      return {
        label: "Interview",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "OFFER":
      return {
        label: "Offer",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch("/api/applications");
        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          setUnauthorized(true);
          setError("Please sign in to view your applications.");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error(data?.error ?? "Failed to load apps");
        setApps(data ?? []);
      } catch (err: any) {
        setError(err.message ?? "Could not load applications");
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const rawLink = (formData.get("link") as string) || "";
    if (rawLink && !rawLink.startsWith("http://") && !rawLink.startsWith("https://")) {
      setError("Please enter a full URL starting with http:// or https://");
      setFormLoading(false);
      return;
    }

    const body = {
      company: formData.get("company"),
      role: formData.get("role"),
      link: rawLink,
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to add applications.");
        return;
      }

      if (!res.ok) throw new Error(data?.error ?? "Failed to create app");
      setApps((prev) => [data, ...prev]);
      form.reset();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: AppStatus) {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to update applications.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update status");
      }

      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not update status");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      const res = await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        setUnauthorized(true);
        setError("Please sign in to delete applications.");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete application");
      }

      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Could not delete application");
    }
  }

  if (unauthorized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
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
          <CardTitle>Add application</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Job link</Label>
              <Input
                id="link"
                name="link"
                placeholder="https://careers..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Saving..." : "Save application"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading applications…
            </p>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No applications tracked yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {apps.map((a) => {
                const styles = appStatusStyles(a.status);
                return (
                  <li
                    key={a.id}
                    className="rounded-md border px-3 py-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <span className="font-medium">
                        {a.company} – {a.role}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        Applied{" "}
                        {new Date(a.appliedAt).toLocaleDateString()}
                      </div>
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 underline mt-1 inline-block"
                        >
                          Job link
                        </a>
                      )}
                      {a.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {a.notes}
                        </div>
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
                        value={a.status}
                        onChange={(e) =>
                          handleStatusChange(
                            a.id,
                            e.target.value as AppStatus
                          )
                        }
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="ONLINE_ASSESSMENT">
                          Online assessment
                        </option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
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
