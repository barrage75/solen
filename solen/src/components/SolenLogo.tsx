import Image from "next/image";

// Logo officiel de Solen : public/solen-logo.png. Remplacer ce fichier suffit à changer le logo partout.
export const SolenLogo = ({ size = 20, className }: { size?: number; className?: string }) => (
  <Image src="/solen-logo.png" alt="Solen" width={size} height={size} className={className} unoptimized />
);
