// src/app/auth/sign-in/page.tsx
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function signInAction(formData: FormData) {
  "use server";

  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return redirect("/auth/sign-in?error=MissingCredentials");
  }

  try {
    await signIn("credentials", {
      redirectTo: "/dashboard",
      email,
      password,
    });
  } catch (error) {
    // Auth.js throws AuthError for known auth issues
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return redirect("/auth/sign-in?error=CredentialsSignin");
      }

      // any other auth-related issue
      return redirect("/auth/sign-in?error=AuthError");
    }

    // rethrow unexpected errors so Next.js can handle them
    throw error;
  }
}

function getErrorMessage(code?: string) {
  if (!code) return null;

  switch (code) {
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "MissingCredentials":
      return "Please enter both email and password.";
    case "AuthError":
      return "Unable to sign you in right now. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  // In Next.js 15/16, searchParams is async
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={signInAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="text-sm text-muted-foreground mt-4 text-center">
              Don’t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="underline hover:text-primary"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
