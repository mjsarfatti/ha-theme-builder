/**
 * Typography: the single Body font knob (`docs/UX-SPEC.md` §3.2 group 1,
 * §7.3). One `Select`, grouped and ordered by `FONT_CATEGORY_LABELS`/`FONTS`
 * — never a hardcoded list. A pick writes `fonts.body`, `fonts.heading` and
 * `fonts.longform` together; `fonts.code` has no control in v1.
 */
import { FONT_CATEGORY_LABELS, FONTS, getFont, type FontCategory, type FontId } from "@/engine"
import { FieldDescription } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarField } from "@/components/sidebar/SidebarField"

const CATEGORY_ORDER = Object.keys(FONT_CATEGORY_LABELS) as FontCategory[]

interface TypographyGroupProps {
  readonly bodyFont: FontId
  readonly onChange: (fontId: FontId) => void
}

export function TypographyGroup({ bodyFont, onChange }: TypographyGroupProps) {
  return (
    <SidebarField label="Body font family">
      <Select
        value={bodyFont}
        onValueChange={(value) => onChange(value as FontId)}
      >
        <SelectTrigger className="w-full">
          <SelectValue>{() => getFont(bodyFont).label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_ORDER.map((category) => (
            <SelectGroup key={category}>
              <SelectLabel>{FONT_CATEGORY_LABELS[category]}</SelectLabel>
              {FONTS.filter((font) => font.category === category).map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <span style={{ fontFamily: font.stack }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        Most of the UI: labels, buttons, entity names, headings and long text. Code stays
        monospace.
      </FieldDescription>
    </SidebarField>
  )
}
