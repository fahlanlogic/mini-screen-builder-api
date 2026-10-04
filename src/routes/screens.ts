import { Router } from "express";
import { Prisma, type Screen } from "../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
  checkElements,
  createScreenSchema,
  saveScreenSchema,
} from "../schemas";

export const screensRouter = Router();

const toDraft = (s: Screen) => ({
  id: s.id,
  width: s.width,
  height: s.height,
  elements: s.elements,
  publishedVersion: s.publishedVersion,
  updatedAt: s.updatedAt,
});

// POST /screens: buat canvas
screensRouter.post("/", async (req, res) => {
  const parsed = createScreenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  const screen = await prisma.screen.create({ data: parsed.data });
  res.status(201).json(toDraft(screen));
});

// GET /screens/:id: ambil draft
screensRouter.get("/:id", async (req, res) => {
  const screen = await prisma.screen.findUnique({
    where: { id: req.params.id },
  });
  if (!screen) {
    res.status(404).json({ error: "Screen tidak ditemukan" });
    return;
  }
  res.json(toDraft(screen));
});

// PUT /screens/:id: simpan draft (semua elemen sekaligus)
screensRouter.put("/:id", async (req, res) => {
  const screen = await prisma.screen.findUnique({
    where: { id: req.params.id },
  });
  if (!screen) {
    res.status(404).json({ error: "Screen tidak ditemukan" });
    return;
  }

  const parsed = saveScreenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  const error = checkElements(
    parsed.data.elements,
    screen.width,
    screen.height,
  );
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const updated = await prisma.screen.update({
    where: { id: screen.id },
    data: { elements: parsed.data.elements as Prisma.InputJsonValue },
  });
  res.json(toDraft(updated));
});

// POST /screens/:id/publish: salin draft jadi versi baru
screensRouter.post("/:id/publish", async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.screen.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    res.status(404).json({ error: "Screen tidak ditemukan" });
    return;
  }

  const published = await prisma.$transaction(async (tx) => {
    // update dulu: menaikkan versi sekaligus mengunci baris,
    // jadi dua publish bersamaan tidak akan mendapat nomor yang sama
    const draft = await tx.screen.update({
      where: { id },
      data: { publishedVersion: { increment: 1 } },
    });

    return tx.publishedScreen.create({
      data: {
        screenId: id,
        version: draft.publishedVersion,
        width: draft.width,
        height: draft.height,
        elements: draft.elements as Prisma.InputJsonValue,
      },
    });
  });

  res.status(201).json({
    screenId: id,
    version: published.version,
    publishedAt: published.createdAt,
  });
});

// GET /screens/:id/published: versi publish terbaru (untuk desktop app)
screensRouter.get("/:id/published", async (req, res) => {
  const published = await prisma.publishedScreen.findFirst({
    where: { screenId: req.params.id },
    orderBy: { version: "desc" },
  });

  if (!published) {
    res.status(404).json({ error: "Belum ada versi yang dipublish" });
    return;
  }

  res.json({
    screenId: published.screenId,
    version: published.version,
    width: published.width,
    height: published.height,
    elements: published.elements,
    publishedAt: published.createdAt,
  });
});
