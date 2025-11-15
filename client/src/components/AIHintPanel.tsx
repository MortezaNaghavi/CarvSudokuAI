import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap } from "lucide-react";

interface AIHintPanelProps {
  onRequestHint: () => void;
  hint: number[] | null;
  disabled: boolean;
  hintsRemaining: number;
  explanation?: string | null;
  suggestedNumber?: number | null;
  onApplyHint?: () => void;
}

export function AIHintPanel({
  onRequestHint,
  hint,
  disabled,
  hintsRemaining,
  explanation,
  suggestedNumber,
  onApplyHint,
}: AIHintPanelProps) {
  const [isThinking, setIsThinking] = useState(false);

  const handleHintRequest = async () => {
    setIsThinking(true);
    setTimeout(() => {
      onRequestHint();
      setIsThinking(false);
    }, 800);
  };

  return (
    <Card className="border-ai-cyan/20 bg-gradient-to-br from-card to-ai-cyan/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-ai-cyan/10">
              <Sparkles className="w-4 h-4 text-ai-cyan" />
            </div>
            <div>
              <CardTitle className="text-base">CARV AI Agent</CardTitle>
              <CardDescription className="text-xs">Intelligent hint system</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-ai-cyan/30" data-testid="badge-hints-remaining">
            <Zap className="w-3 h-3" />
            {hintsRemaining} left
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hint && hint.length > 0 ? (
          <div className="p-3 rounded-md bg-ai-cyan/10 border border-ai-cyan/20" data-testid="div-hint-display">
            <p className="text-xs text-muted-foreground mb-2">Possible numbers for this cell:</p>
            <div className="flex flex-wrap gap-2">
              {hint.map((num) => (
                <Badge
                  key={num}
                  variant="default"
                  className="text-base font-mono font-semibold bg-ai-cyan hover:bg-ai-cyan/90"
                >
                  {num}
                </Badge>
              ))}
            </div>
            {explanation && (
              <p className="mt-2 text-xs text-muted-foreground text-left">
                {explanation}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Select a cell to get AI-powered hints
            </p>
          </div>
        )}
        
        <Button
          onClick={handleHintRequest}
          disabled={disabled || isThinking || hintsRemaining <= 0}
          className="w-full gap-2 bg-ai-cyan hover:bg-ai-cyan/90 text-white"
          data-testid="button-request-hint"
        >
          <Sparkles className={`w-4 h-4 ${isThinking ? 'animate-pulse' : ''}`} />
          {isThinking ? "CARV AI Thinking..." : "Ask CARV AI for Hint"}
        </Button>

        {hint && hint.length > 0 && suggestedNumber != null && onApplyHint && (
          <Button
            onClick={onApplyHint}
            className="w-full gap-2"
            variant="outline"
            size="sm"
          >
            Place <span className="font-mono font-semibold">{suggestedNumber}</span> in this cell
          </Button>
        )}
        
        <p className="text-xs text-center text-muted-foreground">
          Powered by CARV Protocol • On-chain verification
        </p>
      </CardContent>
    </Card>
  );
}
