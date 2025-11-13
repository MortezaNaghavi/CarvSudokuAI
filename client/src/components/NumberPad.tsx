import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, StickyNote } from "lucide-react";

interface NumberPadProps {
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  notesMode: boolean;
  disabled: boolean;
}

export function NumberPad({ onNumberSelect, onErase, onToggleNotes, notesMode, disabled }: NumberPadProps) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            onClick={() => onNumberSelect(num)}
            disabled={disabled}
            size="lg"
            variant={notesMode ? "outline" : "default"}
            className="text-xl font-mono font-semibold aspect-square min-h-14"
            data-testid={`button-number-${num}`}
          >
            {num}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onErase}
          disabled={disabled}
          variant="secondary"
          size="lg"
          className="gap-2"
          data-testid="button-erase"
        >
          <Eraser className="w-4 h-4" />
          Erase
        </Button>
        <Button
          onClick={onToggleNotes}
          disabled={disabled}
          variant={notesMode ? "default" : "secondary"}
          size="lg"
          className="gap-2"
          data-testid="button-toggle-notes"
        >
          <StickyNote className="w-4 h-4" />
          Notes
        </Button>
      </div>
    </Card>
  );
}
