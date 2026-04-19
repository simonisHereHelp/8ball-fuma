import { AuthButtons } from "@/components/auth-buttons";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-xl font-semibold">我的文件啊</h1>
      <p className="mx-auto mb-6 max-w-xl text-fd-muted-foreground">
        Sign in with Google to access.
      </p>
      <AuthButtons />
    </main>
  );
}
