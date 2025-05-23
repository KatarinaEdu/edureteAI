import { CHAT_MODELS, MODELS_WITHOUT_IMAGE_SUPPORT } from "@/lib/chat-config";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatSettingsProps {
  model: string;
  system: string | undefined;
  onModelChange: (value: string) => void;
  onSystemChange: (value: string) => void;
  hasImagesInConversation: boolean;
}

export function ChatSettings({ model, system, onModelChange, onSystemChange, hasImagesInConversation }: ChatSettingsProps) {
  return (
    <div className="flex justify-between pb-1">
      <Select onValueChange={onModelChange} value={model}>
        <SelectTrigger className="max-w-72 mb-2">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent className="overflow-visible">
          <SelectGroup>
            <SelectLabel>Dostupni modeli</SelectLabel>
            <TooltipProvider>
              {CHAT_MODELS.map(({ value, label }) =>
                hasImagesInConversation && MODELS_WITHOUT_IMAGE_SUPPORT.includes(value) ? (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <div>
                        <SelectItem value={value} disabled={hasImagesInConversation && MODELS_WITHOUT_IMAGE_SUPPORT.includes(value)}>
                          {label}
                        </SelectItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={15}>
                      <p className="max-w-xs">Tvoj razgovor sadrži slike, ali ovaj model ne podržava unos slika. Odaberi drugi model.</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </TooltipProvider>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="mb-2">
            Prilagodi sebi
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-86 m-4">
          <Textarea
            className="p-2 h-62"
            value={system || ""}
            onChange={(e) => onSystemChange(e.target.value)}
            placeholder="Pozdrav, pripremam se za maturu/ispit/usmeni ispit i trebao/la bih pomoć pri rješavanju zadatka. Molim te da mi pružiš detaljno/vrlo detaljno/sažeto objašnjenje teorije potrebne za njegovo rješavanje, zatim da samostalno riješiš zadatak uz sažetak ključnih koraka. Nakon toga, želio/željela bih tvoju asistenciju korak po korak dok ga pokušavam riješiti sam/a. Kada završim, ponudi mi generiranje sličnog/težeg/lakšeg zadatka za dodatnu vježbu."
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
