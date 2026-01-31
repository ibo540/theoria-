"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import Button from "./ui/Buttons/p-button/Button";
import CompassButton from "./ui/Buttons/compass-button/CompassButton";
import { useMapStore } from "@/stores/useMapStore";
import Credits from "./Credits";

export default function Navbar() {
  const router = useRouter();
  const bearing = useMapStore((state) => state.bearing);
  const resetToNorth = useMapStore((state) => state.resetToNorth);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const handleAdminClick = () => {
    router.push("/admin/login");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 flex items-center p-4 bg-transparent">
        {/* Website name aligned to left */}
        <div className="text-5xl text-primary-gold tracking-wider">THEORIA</div>

        {/* Buttons on the right */}
        <div className="ml-auto flex items-center gap-8">
          <CompassButton bearing={bearing} onClick={resetToNorth} />

          <Button borderStyle="five" variant="text" onClick={handleAdminClick}>
            Admin Dashboard
          </Button>

          <Button
            borderStyle="five"
            variant="icon"
            onClick={() => setIsCreditsOpen(true)}
            className="text-3xl font-bold"
          >
            <Info size={24} />
          </Button>
        </div>
      </nav>
      <Credits isOpen={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
    </>
  );
}
