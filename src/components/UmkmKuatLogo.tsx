import React from 'react';

export const OFFICIAL_LOGO_URL = '/assets/aistudio/LOGO_UMKM_79d88cbb.jpg';

interface UmkmKuatLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark'; // 'light' for dark backgrounds (white text), 'dark' for light backgrounds
}

export const UmkmKuatLogo: React.FC<UmkmKuatLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'dark',
}) => {
  const sizeMap = {
    sm: { icon: 36, text: 'text-xs', subtext: 'text-[9px]' },
    md: { icon: 46, text: 'text-sm', subtext: 'text-[10px]' },
    lg: { icon: 58, text: 'text-base', subtext: 'text-xs' },
    xl: { icon: 78, text: 'text-xl', subtext: 'text-sm' },
  };

  const { icon, text, subtext } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Logo Image uploaded by user */}
      <div
        className="relative flex-shrink-0 rounded-full overflow-hidden shadow-xs border-2 border-slate-200/80 bg-white transition-transform hover:scale-105 duration-200"
        style={{ width: icon, height: icon }}
      >
        <img
          src={OFFICIAL_LOGO_URL}
          alt="Logo Forum UMKM KUAT Kecamatan Tangerang"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Typography */}
      {variant === 'full' && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight font-sans ${text} ${
                theme === 'light' ? 'text-white' : 'text-slate-900'
              }`}
            >
              UMKM <span className="text-teal-600 dark:text-teal-400">KUAT</span>
            </span>
            <span className="inline-block bg-orange-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider shadow-xs">
              FORUM
            </span>
          </div>
          <span
            className={`font-semibold tracking-wider uppercase ${subtext} ${
              theme === 'light' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Kecamatan Tangerang
          </span>
          <span className="text-[8px] text-teal-600 font-bold tracking-tighter uppercase hidden sm:block">
            Kreatif &bull; Unggul &bull; Aktif &bull; Teladan
          </span>
        </div>
      )}
    </div>
  );
};
