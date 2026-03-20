import type { Id } from "../../../convex/_generated/dataModel";

export interface Namespace {
  _id: Id<"namespaces">;
  slug: string;
  description?: string;
}

export interface ShortLinkResult {
  shortCode: string;
  linkId: Id<"links">;
}

export type ExportFormat = "png" | "webp" | "svg";
