/**
 * The shared preset-picker pattern for Base tone and Entity colors
 * (`docs/UX-SPEC.md` §3.3): a vertical list of named color strips, radio
 * semantics, plus a "Compare all" escape hatch into a reference-table
 * dialog. Both call sites build their own `items`/`compareColumns`/
 * `compareRows` from engine data — this file renders, it does not decide
 * preset order or labels.
 */
import * as React from "react"
import { Radio } from "@base-ui/react/radio"

import type { Hex } from "@/engine"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup } from "@/components/ui/radio-group"

export interface PresetStripItem {
  readonly id: string
  readonly label: string
  readonly swatches: readonly Hex[]
}

export interface CompareAllColumn {
  readonly id: string
  readonly label: string
}

export interface CompareAllRow {
  readonly label: string
  readonly cells: Readonly<Record<string, Hex>>
}

function Strip({ swatches }: { swatches: readonly Hex[] }) {
  return (
    <span className="flex h-3.5 w-full overflow-hidden rounded-sm" aria-hidden="true">
      {swatches.map((hex, index) => (
        <span key={index} className="h-full flex-1" style={{ backgroundColor: hex }} />
      ))}
    </span>
  )
}

interface PresetStripListProps {
  readonly ariaLabel: string
  readonly items: readonly PresetStripItem[]
  readonly value: string
  readonly onChange: (id: string) => void
  readonly compareTitle: string
  readonly compareColumns: readonly CompareAllColumn[]
  readonly compareRows: readonly CompareAllRow[]
}

export function PresetStripList({
  ariaLabel,
  items,
  value,
  onChange,
  compareTitle,
  compareColumns,
  compareRows,
}: PresetStripListProps) {
  const [compareOpen, setCompareOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-2" data-preset-list="">
      <RadioGroup
        aria-label={ariaLabel}
        value={value}
        onValueChange={(id) => onChange(id as string)}
        className="flex flex-col gap-1"
      >
        {items.map((item) => (
          <Radio.Root
            key={item.id}
            value={item.id}
            aria-label={item.label}
            className={cn(
              "group flex flex-col gap-1 rounded-lg border border-transparent p-1.5 outline-none",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "data-checked:border-ring data-checked:ring-1 data-checked:ring-ring"
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full border border-input group-data-checked:border-primary group-data-checked:bg-primary"
              />
              {item.label}
            </span>
            <Strip swatches={item.swatches} />
          </Radio.Root>
        ))}
      </RadioGroup>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogTrigger render={<Button variant="link" className="h-auto self-start p-0 text-xs" />}>
          Compare all
        </DialogTrigger>
        <DialogContent className="max-w-[min(1100px,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle className="sr-only">{compareTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-popover">
                <tr>
                  <th className="p-1.5 text-left font-medium text-muted-foreground">Step</th>
                  {compareColumns.map((column) => (
                    <th key={column.id} className="p-1">
                      <button
                        type="button"
                        className="w-full rounded-md p-1 text-center font-medium hover:bg-muted"
                        onClick={() => {
                          onChange(column.id)
                          setCompareOpen(false)
                        }}
                      >
                        {column.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <td className="p-1.5 font-mono text-muted-foreground">{row.label}</td>
                    {compareColumns.map((column) => (
                      <td key={column.id} className="p-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            aria-hidden="true"
                            className="size-6 rounded ring-1 ring-inset ring-black/12"
                            style={{ backgroundColor: row.cells[column.id] }}
                          />
                          <span className="font-mono text-[0.65rem] text-muted-foreground">
                            {row.cells[column.id]}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
