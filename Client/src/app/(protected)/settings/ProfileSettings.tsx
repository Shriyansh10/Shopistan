import Header from "../../../components/Header";
import { useAuth } from "../../../context/auth.context";

export default function ProfileSettings() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth only renders this page when logged in

  const fields = [
    { label: "First name", value: user.first_name },
    { label: "Last name", value: user.last_name },
    { label: "Email", value: user.email_id },
    { label: "Phone", value: user.phone_no ? user.phone_no.replace("_", " ") : "—" },
  ];

  return (
    <div className="min-h-svh bg-surface font-sans text-ink antialiased">
      <Header />

      <main className="mx-auto max-w-300 px-4 py-12 xl:px-0">
        <p className="text-[13px] font-semibold tracking-[3.5px] text-brand uppercase">Settings</p>
        <h1 className="mt-3 text-4xl leading-[1.1] font-bold tracking-[-1.2px]">Profile</h1>

        <section className="mt-8 max-w-160 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Personal information</h2>
          <p className="mt-1 text-sm text-muted">Editing your details isn't available yet.</p>

          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <dt className="text-[13px] font-medium text-muted">{f.label}</dt>
                <dd className="text-[15px] break-all">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
