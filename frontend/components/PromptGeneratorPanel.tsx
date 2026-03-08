import { useMemo } from "react";
import {
  buildGeneratedPrompt,
  CAMERA_ANGLE_PRESETS,
  CAMERA_MOVEMENT_PRESETS,
  DEFAULT_PROMPT_GENERATOR_STATE,
  LENS_FEEL_PRESETS,
  LIGHTING_PRESETS,
  mergePrompt,
  MOOD_PRESETS,
  PromptGeneratorState,
  SHOT_TYPE_PRESETS,
  STYLE_PRESETS,
} from "./prompt-utils";

type Props = {
  value: PromptGeneratorState;
  onChange: (next: PromptGeneratorState) => void;
  currentPrompt: string;
  onInsert: (nextPrompt: string) => void;
  onReset?: () => void;
};

function toggleMovement(
  current: string[],
  item: string,
): string[] {
  return current.includes(item)
    ? current.filter((value) => value !== item)
    : [...current, item];
}

export default function PromptGeneratorPanel({
  value,
  onChange,
  currentPrompt,
  onInsert,
  onReset,
}: Props) {
  const generated = useMemo(() => buildGeneratedPrompt(value), [value]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg md:text-xl font-semibold">Prompt Generator</h3>
          <p className="text-sm text-white/60">
            Builder cepat untuk image dan video tanpa mengubah pipeline generate.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onInsert(generated)}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            Replace Prompt
          </button>
          <button
            type="button"
            onClick={() => onInsert(mergePrompt(currentPrompt, generated))}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Insert to Prompt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-white/75">Language</label>
          <select
            value={value.lang}
            onChange={(e) => onChange({ ...value, lang: e.target.value as "id" | "en" })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/75">Style</label>
          <select
            value={value.style}
            onChange={(e) => onChange({ ...value, style: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select style</option>
            {STYLE_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <TextField
          label="Subject"
          value={value.subject}
          onChange={(next) => onChange({ ...value, subject: next })}
          placeholder="A woman holding a coffee cup"
        />

        <TextField
          label="Setting / Location"
          value={value.setting}
          onChange={(next) => onChange({ ...value, setting: next })}
          placeholder="Traditional kitchen, warm morning light"
        />

        <div className="space-y-2">
          <label className="text-sm text-white/75">Shot Type</label>
          <select
            value={value.shotType}
            onChange={(e) => onChange({ ...value, shotType: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select shot type</option>
            {SHOT_TYPE_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/75">Camera Angle</label>
          <select
            value={value.cameraAngle}
            onChange={(e) => onChange({ ...value, cameraAngle: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select camera angle</option>
            {CAMERA_ANGLE_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/75">Lens Feel</label>
          <select
            value={value.lensFeel}
            onChange={(e) => onChange({ ...value, lensFeel: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select lens feel</option>
            {LENS_FEEL_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/75">Lighting</label>
          <select
            value={value.lighting}
            onChange={(e) => onChange({ ...value, lighting: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select lighting</option>
            {LIGHTING_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/75">Mood</label>
          <select
            value={value.mood}
            onChange={(e) => onChange({ ...value, mood: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Select mood</option>
            {MOOD_PRESETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-white/75">Camera Movement</div>
        <div className="flex flex-wrap gap-2">
          {CAMERA_MOVEMENT_PRESETS.map((item) => {
            const active = value.cameraMovement.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    cameraMovement: toggleMovement(value.cameraMovement, item),
                  })
                }
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-black/20 hover:bg-white/10",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <TextAreaField
          label="Additional Details"
          value={value.extraDetails}
          onChange={(next) => onChange({ ...value, extraDetails: next })}
          placeholder="Product-focused framing, subtle steam from coffee, clean composition"
          rows={4}
        />

        <div className="space-y-2">
          <label className="text-sm text-white/75">Generated Prompt</label>
          <textarea
            value={generated}
            readOnly
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={onReset ?? (() => onChange(DEFAULT_PROMPT_GENERATOR_STATE))}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
        >
          Reset Builder
        </button>
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-white/75">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
      />
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-white/75">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3"
      />
    </div>
  );
}
