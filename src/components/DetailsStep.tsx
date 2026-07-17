import { destinations } from "../data/destinations";
import type { ApplicantDetails } from "../types";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-study";
const labelCls = "text-xs font-bold uppercase tracking-wide text-ink-soft";

export default function DetailsStep({
  details,
  onChange,
  onNext,
}: {
  details: ApplicantDetails;
  onChange: (details: ApplicantDetails) => void;
  onNext: () => void;
}) {
  const dest = destinations.find((d) => d.name === details.destination);
  const set = <K extends keyof ApplicantDetails>(key: K, value: ApplicantDetails[K]) =>
    onChange({ ...details, [key]: value, ...(key === "destination" ? { program: "" } : {}) });

  const canContinue = details.fullName && details.email && details.phone && details.destination && details.program;

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-ink">Personal Information</h2>
      <p className="mt-1 text-sm text-ink-soft">Fill in your details accurately</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelCls}>Full Name *</span>
          <input className={inputCls} placeholder="e.g. Adaeze Okonkwo" value={details.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </label>
        <label>
          <span className={labelCls}>Email Address *</span>
          <input type="email" className={inputCls} placeholder="yourname@email.com" value={details.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          <span className={labelCls}>Phone Number *</span>
          <input type="tel" className={inputCls} placeholder="+234 800 000 0000" value={details.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label>
          <span className={labelCls}>Destination *</span>
          <select className={inputCls} value={details.destination} onChange={(e) => set("destination", e.target.value)}>
            <option value="">Select a destination...</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.name}>{d.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Program *</span>
          <select className={inputCls} value={details.program} onChange={(e) => set("program", e.target.value)} disabled={!dest}>
            <option value="">{dest ? "Select a program..." : "Choose a destination first"}</option>
            {dest?.programs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>City</span>
          <input className={inputCls} placeholder="e.g. Lagos" value={details.city} onChange={(e) => set("city", e.target.value)} />
        </label>
        <label>
          <span className={labelCls}>Gender</span>
          <select className={inputCls} value={details.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select gender...</option>
            <option>Male</option>
            <option>Female</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label>
          <span className={labelCls}>Date of Birth</span>
          <input type="date" className={inputCls} value={details.dob} onChange={(e) => set("dob", e.target.value)} />
        </label>
        <label>
          <span className={labelCls}>Age</span>
          <input type="number" className={inputCls} placeholder="e.g. 24" value={details.age} onChange={(e) => set("age", e.target.value)} />
        </label>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="mt-6 w-full rounded-full bg-study px-6 py-3.5 font-bold text-white transition-all hover:bg-study-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to Documents →
      </button>
    </div>
  );
}
