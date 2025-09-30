export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LabLink Logo"
      className={className}
    >
      <path
        fill="currentColor"
        d="M85,30 C85,18.95 76.05,10 65,10 L35,10 C23.95,10 15,18.95 15,30 L15,60 C15,71.05 23.95,80 35,80 L55,80 L55,90 L70,80 L85,80 L85,30 Z M30,22 C32.76,22 35,24.24 35,27 C35,29.76 32.76,32 30,32 C27.24,32 25,29.76 25,27 C25,24.24 27.24,22 30,22 Z M70,22 C72.76,22 75,24.24 75,27 C75,29.76 72.76,32 70,32 C67.24,32 65,29.76 65,27 C65,24.24 67.24,22 70,22 Z"
      />
    </svg>
  )
}


