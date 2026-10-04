import { z } from "zod";

const base = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().min(1),
  height: z.number().min(1),
  zIndex: z.number(),
};

const textEl = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string(),
  color: z.string(),
  fontSize: z.number().min(1),
});

const imageEl = z.object({
  ...base,
  type: z.literal("image"),
  imageUrl: z.string(),
});

const buttonEl = z.object({
  ...base,
  type: z.literal("button"),
  label: z.string(),
  actionId: z.string(),
  backgroundColor: z.string(),
  color: z.string(),
  fontSize: z.number().min(1),
});

export const elementSchema = z.discriminatedUnion("type", [
  textEl,
  imageEl,
  buttonEl,
]);
export type CanvasElement = z.infer<typeof elementSchema>;

export const createScreenSchema = z.object({
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
});

// Aturan: maksimal 20 elemen
export const saveScreenSchema = z.object({
  elements: z.array(elementSchema).max(20, "Maksimal 20 elemen per screen"),
});

// Aturan: elemen harus di dalam canvas (+ id tidak boleh kembar)
export function checkElements(
  elements: CanvasElement[],
  width: number,
  height: number,
): string | null {
  const ids = new Set<string>();

  for (const el of elements) {
    if (ids.has(el.id)) return `ID elemen kembar: ${el.id}`;
    ids.add(el.id);

    if (
      el.x < 0 ||
      el.y < 0 ||
      el.x + el.width > width ||
      el.y + el.height > height
    ) {
      return `Elemen ${el.id} keluar dari canvas`;
    }
  }
  return null;
}
