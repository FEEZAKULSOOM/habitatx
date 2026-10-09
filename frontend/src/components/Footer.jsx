import { Link } from 'react-router-dom';
import { Compass, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-32 mb-4 border-t border-[#262522] bg-[#0B0B0A] pt-20 pb-12 text-[#A5A095]">
      {/* Subtle top architectural ambient beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D2A52C]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 pb-16 border-b border-[#1E1E1C]">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#181816] border border-[#262522] text-[#D2A52C] transition-colors group-hover:border-[#D2A52C]/60">
                <Compass className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Syne'] text-xl font-bold tracking-[0.2em] text-[#F4F0E6] uppercase">
                  HABITAT<span className="text-[#D2A52C]">X</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#A5A095]/70">
                  Architectural Living Platform
                </span>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-[#A5A095]">
              Curating spaces at the intersection of architecture, technology, and intentional human dwelling. Built for those who value structure, light, and materiality.
            </p>

            <div className="flex items-center gap-2 font-mono text-[11px] text-[#A5A095] uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-[#D2A52C] animate-pulse" />
              <span>Platform Status: Operational // v2.6.4</span>
            </div>
          </div>

          {/* Editorial Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:col-span-4">
            <div className="space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F4F0E6]">Discovery</p>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/" className="transition hover:text-[#D2A52C] flex items-center gap-1 group">
                    <span>Index of Places</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#D2A52C]" />
                  </Link>
                </li>
                <li>
                  <Link to="/saved" className="transition hover:text-[#D2A52C] flex items-center gap-1 group">
                    <span>Curated Vault</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#D2A52C]" />
                  </Link>
                </li>
                <li>
                  <span className="text-[#65635D] cursor-not-allowed">Atmospheric Maps</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F4F0E6]">Protocol</p>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-[#65635D] cursor-not-allowed">Spatial Verification</span>
                </li>
                <li>
                  <span className="text-[#65635D] cursor-not-allowed">Curator Standards</span>
                </li>
                <li>
                  <span className="text-[#65635D] cursor-not-allowed">Material Disclosures</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Assurance Column */}
          <div className="lg:col-span-3 space-y-4 rounded-sm border border-[#262522] bg-[#111110] p-6">
            <div className="flex items-center gap-2 text-[#D2A52C]">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">Verified Architecture</span>
            </div>
            <p className="text-xs leading-relaxed text-[#A5A095]">
              Every dwelling indexed on HabitatX adheres to rigorous structural integrity and architectural provenance standards.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row text-xs font-mono">
          <p className="text-[#A5A095]/60">
            © {currentYear} HABITATX DIGITAL PLACE LABS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-[#A5A095]/60">
            <span className="hover:text-[#D2A52C] transition cursor-pointer">PRIVACY MANIFESTO</span>
            <span className="hover:text-[#D2A52C] transition cursor-pointer">TERMS OF HABITATION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}