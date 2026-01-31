import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxWithInputProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  manualInputLabel?: string;
  allowManualInput?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ComboboxWithInput({
  options,
  value,
  onValueChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج",
  manualInputLabel = "إدخال يدوي",
  allowManualInput = true,
  disabled = false,
  className,
}: ComboboxWithInputProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Check if value is from options or manual
  const selectedOption = options.find((option) => option.value === value);
  const isManualValue = value && !selectedOption && value.startsWith("manual:");
  const manualDisplayValue = isManualValue ? value.replace("manual:", "") : "";

  // Display text
  const displayText = selectedOption
    ? selectedOption.label
    : isManualValue
    ? manualDisplayValue
    : "";

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleManualInput = () => {
    if (searchValue.trim()) {
      onValueChange(`manual:${searchValue.trim()}`);
      setOpen(false);
      setSearchValue("");
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showManualOption =
    allowManualInput &&
    searchValue.trim() &&
    !filteredOptions.some(
      (opt) => opt.label.toLowerCase() === searchValue.toLowerCase()
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !displayText && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {displayText || placeholder}
          </span>
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="text-right"
          />
          <CommandList>
            <CommandEmpty>
              {allowManualInput && searchValue.trim() ? (
                <button
                  className="w-full p-2 text-sm text-right hover:bg-accent flex items-center gap-2 cursor-pointer"
                  onClick={handleManualInput}
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة "{searchValue}" كإدخال يدوي</span>
                </button>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col items-start">
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {showManualOption && (
              <>
                <CommandSeparator />
                <CommandGroup heading={manualInputLabel}>
                  <CommandItem
                    onSelect={handleManualInput}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة "{searchValue}"</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ComboboxWithInput;
