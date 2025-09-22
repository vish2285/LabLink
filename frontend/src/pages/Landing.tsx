import React, { useState } from 'react'

export default function Landing() {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <div className="mx-auto max-w-screen-xl gap-12 px-4 py-28 text-gray-600 md:px-8">
        <div className="mx-auto max-w-4xl space-y-5 text-center">
          <h1 className="text-sm font-medium text-[#FFBF00]">Built for UC Davis students</h1>
          <h2 className="mx-auto text-4xl font-extrabold text-gray-800 md:text-5xl">
            Find UC Davis professors aligned with your interests via
            <span className="bg-gradient-to-r from-[#002855] to-[#FFBF00] bg-clip-text text-transparent"> ResearchMatch</span>
          </h2>
          <p className="mx-auto max-w-2xl">
            Enter your interests and skills. We surface UC Davis faculty who match and help you send a professional outreach email.
          </p>
          <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
            <a href="/profile" className="block rounded-lg bg-[#002855] py-2 px-4 font-medium text-white shadow-lg duration-150 hover:opacity-90">
              Get started
            </a>
            <button onClick={() => setOpen(true)} className="block rounded-lg border py-2 px-4 font-medium text-gray-700 duration-150 hover:text-gray-500 active:bg-gray-100">
              Watch demo
            </button>
          </div>
        </div>
        <div className="mt-14">
          <div className="relative">
            <video className="w-full rounded-lg border shadow-lg" controls poster="https://raw.githubusercontent.com/sidiDev/remote-assets/main/Safari%20(Big%20Sur)%20-%20Light.png">
              <source src="https://raw.githubusercontent.com/sidiDev/remote-assets/main/FloatUI.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex h-full w-full items-center justify-center">
          <div className="absolute inset-0 h-full w-full bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative px-4">
            <button
              className="mb-4 h-10 w-10 rounded-full bg-gray-800 text-white duration-150 hover:bg-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="m-auto h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <video className="h-auto w-full max-w-2xl rounded-lg" controls autoPlay>
              <source src="https://raw.githubusercontent.com/sidiDev/remote-assets/main/FloatUI.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </section>
  )
}


