import { demoLogin } from './action';

export default function DemoLoginPage() {
  return (
    <form action={demoLogin} className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Demo Login</h1>
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded"
      >
        Continue as Demo User
      </button>
    </form>
  );
}
