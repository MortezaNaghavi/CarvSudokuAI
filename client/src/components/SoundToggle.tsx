import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { soundManager } from "@/lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  const toggleSound = () => {
    const newState = !enabled;
    setEnabled(newState);
    soundManager.setEnabled(newState);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSound}
      data-testid="button-sound-toggle"
    >
      {enabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
}
