import React from 'react'

export default function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 text-slate-800 dark:text-slate-200">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-3 text-sm leading-6">
        <p>
          LabLink helps students find research mentors by matching interests and skills with professor profiles.
          We take privacy seriously and only collect the minimum information needed to provide this service.
        </p>

        <h2 className="text-lg font-semibold mt-4">Information we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Google account basic profile (email, name, picture) to authenticate UC Davis students. We do not
            access your Google Drive, contacts, or other data.
          </li>
          <li>
            Profile inputs you provide (interests, skills, availability) to compute matches.
          </li>
          <li>
            Basic usage analytics (errors and aggregate usage counts) to improve reliability.
          </li>
        </ul>

        <h2 className="text-lg font-semibold mt-4">How we use your information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Authenticate your session and keep your access limited to UC Davis users.</li>
          <li>Generate and display professor matches and related explanations.</li>
          <li>Optionally generate email drafts you can copy and send.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-4">Data storage and retention</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Professor data is stored in our database to power search and matching.</li>
          <li>
            Your profile inputs are stored only for your session. Some fields may be cached locally in your
            browser (localStorage) so you don’t lose progress.
          </li>
          <li>We do not sell your data. We do not use your data for advertising.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-4">Email</h2>
        <p>
          If you choose to send an email through LabLink, we format the content you provide. Any attachments
          you upload are sent only to the specified recipient and are not retained after delivery.
        </p>

        <h2 className="text-lg font-semibold mt-4">Security</h2>
        <p>
          We use industry-standard security practices and require UC Davis Google authentication. However, no
          method of transmission or storage is 100% secure.
        </p>

        <h2 className="text-lg font-semibold mt-4">Your choices</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You can sign out at any time to revoke access.</li>
          <li>You may delete any locally saved drafts by clearing your browser storage for this site.</li>
          <li>To request data removal, contact us at <a className="underline" href="mailto:lablinkdavis@gmail.com">lablinkdavis@gmail.com</a>.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-4">Contact</h2>
        <p>
          Questions about this policy? Email <a className="underline" href="mailto:lablinkdavis@gmail.com">lablinkdavis@gmail.com</a>.
        </p>
      </section>
    </div>
  )
}


