import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, StickyNote } from "lucide-react";

interface NumberPadProps {
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  notesMode: boolean;
  disabled: boolean;
  completedNumbers?: number[];
}

export function NumberPad({ onNumberSelect, onErase, onToggleNotes, notesMode, disabled, completedNumbers = [] }: NumberPadProps) {
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  return (
    <Card className="p-4 flex flex-col gap-4 max-w-[220px] mx-auto">
      <div className="flex flex-col gap-3 w-full">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-3 w-full">
            {row.map((num) => (
              <Button
                key={num}
                onClick={() => onNumberSelect(num)}
                disabled={disabled || completedNumbers.includes(num)}
                size="lg"
                variant={notesMode ? "outline" : "default"}
                className="text-xl font-mono font-semibold aspect-square min-h-[52px] w-full rounded-xl"
                data-testid={`button-number-${num}`}
              >
                {num}
              </Button>
            ))}
          </div>
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
