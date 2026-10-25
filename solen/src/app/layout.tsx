import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solen — démo",
  description: "Démo Solen : détection des fraudes au virement dans la boîte mail",
  // Icône de l'onglet : le logo officiel, dans public/.
  icons: { icon: "/solen-logo.png", apple: "/solen-logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>
        {children}
        {/* Toujours visible, sur toutes les pages : la maquette ne doit jamais passer pour un vrai service Microsoft. */}
        <p className="demo-disclaimer" role="note">
          Maquette de démonstration Solen — données fictives, sans lien avec Microsoft
        </p>
      </body>
    </html>
  );
}
