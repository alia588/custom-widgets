import { login } from './actions';
import { LoginSubmitButton } from './LoginSubmitButton';

export const metadata = {
  title: 'Login',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 p-8 ring-1 ring-neutral-800">
        <h1 className="text-2xl font-bold text-neutral-100">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500">
          Enter your credentials to access the dashboard.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-400">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg bg-[#ffffff0a] px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg bg-[#ffffff0a] px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
            />
          </div>

          <LoginSubmitButton />
        </form>
      </div>
    </div>
  );
}
