/**
 * A small street scene drawn by hand in SVG. No photo, no generated image:
 * just simple shapes and slightly uneven lines, so the prototype feels made
 * by people for people.
 */
export function HeroSketch() {
  return (
    <svg
      className="hero-sketch"
      viewBox="0 0 560 300"
      role="img"
      aria-label="A neighbour reporting a pothole on their phone while an officer arrives to help fix the street."
    >
      {/* soft backdrop */}
      <circle cx="300" cy="140" r="122" fill="#e8f0fe" />
      <circle cx="430" cy="86" r="46" fill="#fef3c7" />
      <circle cx="118" cy="70" r="20" fill="#f0fdfa" />

      {/* distant buildings */}
      <g stroke="#c7d7f0" strokeWidth="2" fill="#ffffff">
        <rect x="196" y="96" width="44" height="70" rx="4" />
        <rect x="244" y="80" width="52" height="86" rx="4" />
        <rect x="300" y="104" width="38" height="62" rx="4" />
      </g>
      <g fill="#dbe7f8">
        <rect x="206" y="108" width="8" height="9" rx="1" />
        <rect x="222" y="108" width="8" height="9" rx="1" />
        <rect x="206" y="126" width="8" height="9" rx="1" />
        <rect x="222" y="126" width="8" height="9" rx="1" />
        <rect x="256" y="94" width="9" height="10" rx="1" />
        <rect x="274" y="94" width="9" height="10" rx="1" />
        <rect x="256" y="114" width="9" height="10" rx="1" />
        <rect x="274" y="114" width="9" height="10" rx="1" />
        <rect x="310" y="116" width="8" height="9" rx="1" />
        <rect x="324" y="116" width="8" height="9" rx="1" />
      </g>

      {/* tree */}
      <g>
        <path d="M438 214c-1-18 0-30 1-42" stroke="#8d6e63" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="424" cy="150" r="24" fill="#a7d7a7" />
        <circle cx="452" cy="144" r="27" fill="#8ecb8e" />
        <circle cx="438" cy="124" r="22" fill="#b9e4b9" />
        <circle cx="458" cy="168" r="19" fill="#9ad59a" />
      </g>

      {/* street */}
      <path d="M28 236c150-5 340-5 504 1" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M96 238c60-3 240-3 300 1" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M170 246c8-6 26-6 34-1" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M262 247c7-5 22-5 30 0" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* pothole */}
      <path
        d="M236 242c6-9 32-11 42-3 6 5 4 12-6 14-13 3-32 2-38-3-2-2-1-5 2-8Z"
        fill="#8fa3bd"
      />
      <path d="M243 249c9-3 22-3 29 0" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* citizen with phone */}
      <g>
        <path d="M104 236c-2-22 1-38 8-50" stroke="#1a5fd0" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M112 236c1-14 4-24 10-32" stroke="#134aa6" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path
          d="M108 160c8-3 16-2 22 4 5 5 6 14 3 22l-4 14h-22l-4-16c-2-9 0-20 5-24Z"
          fill="#f59e0b"
        />
        <circle cx="119" cy="140" r="16" fill="#c68642" />
        <path d="M105 136c0-11 9-18 19-16 7 1 12 7 12 14-6 1-10-3-14-3-6 0-11 3-17 5Z" fill="#3f2a1d" />
        <path d="M130 176c9-1 16 3 19 9" stroke="#c68642" strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x="146" y="160" width="13" height="21" rx="3" fill="#1f2937" transform="rotate(-8 152 170)" />
        <rect x="148" y="163" width="9" height="14" rx="1.5" fill="#a5f3fc" transform="rotate(-8 152 170)" />
      </g>

      {/* officer with clipboard */}
      <g>
        <path d="M330 236c-1-20 1-34 6-44" stroke="#1f3a5f" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M342 236c1-13 3-22 7-29" stroke="#16293f" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path
          d="M332 176c7-4 16-3 21 3 4 5 5 13 3 20l-3 12h-20l-3-14c-2-8-1-17 2-21Z"
          fill="#0f766e"
        />
        <circle cx="342" cy="158" r="14" fill="#8d5524" />
        <path d="M328 156c-1-10 6-17 14-17 8 0 13 6 13 13-4-1-6-4-10-4-5 0-9 4-17 8Z" fill="#2b1d14" />
        <path d="M352 188c7 1 11 4 13 8" stroke="#8d5524" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <g transform="rotate(-6 372 196)">
          <rect x="356" y="180" width="24" height="30" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.6" />
          <rect x="363" y="176" width="10" height="6" rx="2" fill="#cbd5e1" />
          <path d="M361 190h14M361 197h10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* little marks */}
      <g stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round">
        <path d="M186 174v10M181 179h10" />
        <path d="M492 196v8M488 200h8" />
      </g>
      <path d="M196 64c5-6 11-9 18-9M214 55c1 6 0 11-2 16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
