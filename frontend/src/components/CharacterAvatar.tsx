import React from 'react';

interface CharacterAvatarProps {
  humeur: "neutral" | "happy" | "angry";
  roleName?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ humeur = "neutral", roleName = "Expert Métier" }) => {
  // Eyebrow and mouth paths based on mood
  let leftEyebrow = "M 35 38 Q 45 34 55 38";
  let rightEyebrow = "M 65 38 Q 75 34 85 38";
  let mouth = "M 40 70 Q 50 76 60 70";
  let auraColor = "from-blue-600/30 to-indigo-900/30 border-blue-500/40";

  if (humeur === "happy") {
    leftEyebrow = "M 35 36 Q 45 32 55 36";
    rightEyebrow = "M 65 36 Q 75 32 85 36";
    mouth = "M 38 68 Q 50 82 62 68";
    auraColor = "from-emerald-600/30 to-teal-900/30 border-emerald-500/40";
  } else if (humeur === "angry") {
    leftEyebrow = "M 35 36 Q 45 42 55 40";
    rightEyebrow = "M 65 40 Q 75 42 85 36";
    mouth = "M 40 74 Q 50 64 60 74";
    auraColor = "from-rose-600/30 to-red-900/30 border-rose-500/40";
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-b ${auraColor} border-2 flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-500`}>
        {/* Background glow & particles */}
        <div className="absolute inset-0 bg-radial from-slate-800/80 to-slate-950/90"></div>

        {/* SVG Professional Avatar */}
        <svg viewBox="0 0 100 100" className="w-32 h-32 md:w-40 md:h-40 relative z-10 transition-transform duration-500 hover:scale-105">
          {/* Suit / Shoulders */}
          <path d="M 20 95 L 20 80 Q 20 65 50 65 Q 80 65 80 80 L 80 95 Z" fill="#1e293b" />
          <path d="M 35 65 L 50 82 L 65 65 Z" fill="#0f172a" />
          <path d="M 45 70 L 50 78 L 55 70 Z" fill="#cbd5e1" />

          {/* Neck */}
          <rect x="43" y="52" width="14" height="18" fill="#fbcfe8" rx="3" />

          {/* Head / Face */}
          <ellipse cx="50" cy="45" rx="22" ry="26" fill="#fcd34d" />
          <ellipse cx="50" cy="45" rx="22" ry="26" fill="#fef08a" opacity="0.2" />

          {/* Ears */}
          <circle cx="27" cy="46" r="4" fill="#fcd34d" />
          <circle cx="73" cy="46" r="4" fill="#fcd34d" />

          {/* Hair */}
          <path d="M 28 35 Q 50 15 72 35 Q 75 22 65 20 Q 50 12 35 20 Q 25 22 28 35 Z" fill="#334155" />

          {/* Eyes */}
          <circle cx="41" cy="44" r="3.5" fill="#0f172a" />
          <circle cx="59" cy="44" r="3.5" fill="#0f172a" />
          <circle cx="42" cy="43" r="1" fill="#ffffff" />
          <circle cx="60" cy="43" r="1" fill="#ffffff" />

          {/* Eyebrows */}
          <path d={leftEyebrow} stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={rightEyebrow} stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Nose */}
          <path d="M 50 46 L 48 55 L 52 55 Z" fill="#fbbf24" opacity="0.6" />

          {/* Mouth */}
          <path d={mouth} stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>

        {/* Mood Badge Overlay */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 border border-slate-700 text-slate-200 shadow-md">
          {humeur === "happy" ? "😊 Positif" : humeur === "angry" ? "😠 Tendu" : "😐 Neutre"}
        </div>
      </div>

      <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wide text-center max-w-[180px] truncate">
        {roleName}
      </span>
    </div>
  );
};
