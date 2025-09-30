import Button from '../components/Button'
import FAQ from '../components/FAQ'

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">About LabLink</h1>
        <p className="mt-2 text-slate-300/90">Connecting UC Davis students with professors whose research aligns with their interests.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-2">What it does</h2>
          <p className="text-sm leading-relaxed">
            LabLink analyzes your interests and skills, compares them to faculty interests and recent publications,
            and surfaces professors who are most aligned. It also drafts a professional outreach email that you can edit and send.
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-2">How it works</h2>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Create your profile with interests, skills, and optional department.</li>
            <li>Browse your top matches and see why each professor aligns.</li>
            <li>Open the email editor to generate and send a tailored message.</li>
          </ol>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Privacy</h2>
          <p className="text-sm leading-relaxed">
            Your profile is used only to compute matches and draft emails on your device and our API. No data is sold or shared.
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Get started</h2>
          <p className="text-sm leading-relaxed mb-4">It takes less than a minute to see your first matches.</p>
          <Button asChild>
            <a href="/profile">Create your profile</a>
          </Button>
        </section>
      </div>

      {/* FAQ */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-4">FAQ</h2>
        <FAQ items={faqItems} />
      </div>
    </div>
  )
}

const faqItems = [
  {
    q: 'How are matches computed?',
    a: 'We combine similarities between your interests and faculty interests/publications, alongside overlaps between your skills and faculty skill tags. We blend lexical scores with simple heuristics for a transparent MVP.'
  },
  {
    q: 'Can I attach my CV or resume?',
    a: 'Yes. In the Email Editor, use Attach CV/Resume and click Send Email. The backend sends a real email with your file attached (via SMTP).'
  },
  {
    q: 'Is my data private?',
    a: 'Your profile is only used to compute matches and draft emails. We do not sell or share your data. You can clear it anytime by refreshing or editing your profile.'
  },
  {
    q: 'Which departments are supported?',
    a: 'We currently index UC Davis departments common to engineering and sciences. Department filters help narrow results; more departments can be added.'
  },
]


