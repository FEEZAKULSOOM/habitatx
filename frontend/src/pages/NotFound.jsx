import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center sm:px-6">
      {/* Background Architectural Grid Accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#262522_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-[#D2A52C]/5 blur-3xl" />

      {/* Content Container */}
      <div className="relative z-10 flex max-w-md flex-col items-center">
        {/* Top Status Pill */}
        <div className="flex items-center gap-1.5 border border-[#262522] bg-[#111110] px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-[#D2A52C]">
          <ShieldAlert className="h-3 w-3" />
          <span>Coordinates Unresolved // 404</span>
        </div>

        {/* Compact Proportional 404 Display */}
        <h1 className="mt-4 font-mono text-6xl font-black tracking-normal leading-tight text-[#F4F0E6] sm:text-7xl">
          4<span className="text-[#D2A52C]">0</span>4
        </h1>

        {/* Narrative */}
        <h2 className="mt-2 font-['Syne'] text-base font-semibold tracking-wide text-[#F4F0E6] sm:text-lg">
          Territory Beyond Architectural Index
        </h2>
        <p className="mt-2 max-w-sm font-mono text-[11px] leading-relaxed text-[#A5A095]">
          The requested coordinate does not exist in the HabitatX registry. It may have been decommissioned or relocated.
        </p>

        {/* Compass Node */}
        <div className="my-5 flex h-9 w-9 items-center justify-center rounded-sm border border-[#262522] bg-[#111110] text-[#D2A52C] shadow-[0_0_15px_rgba(210,165,44,0.1)]">
          <Compass className="h-4 w-4 animate-spin [animation-duration:12s]" />
        </div>

        {/* Action Controls */}
        <div className="flex w-full flex-col items-center justify-center gap-2.5 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex w-full items-center justify-center gap-2 border border-[#262522] bg-[#141413] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#F4F0E6] transition-all duration-200 hover:border-[#D2A52C] hover:text-[#D2A52C] active:scale-95 sm:w-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Step Back</span>
          </button>

          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 border border-[#D2A52C] bg-[#D2A52C] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#070707] shadow-[0_2px_12px_rgba(210,165,44,0.18)] transition-all duration-200 hover:bg-[#E3B53B] active:scale-95 sm:w-auto"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Discovery</span>
          </Link>
        </div>
      </div>
    </div>
  );
}