export interface DotStyle {
  id: string;
  label: string;
}

export const DOT_STYLES: DotStyle[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "dots", label: "Dots" },
  { id: "classy", label: "Classy" },
  { id: "classy-rounded", label: "Leaf" },
  { id: "extra-rounded", label: "Blob" },
];

/** Default download filename for single QR code exports */
export const DOWNLOAD_FILENAME_SINGLE = "qrni-code";

/** Default download filename prefix for bulk exports */
export const DOWNLOAD_FILENAME_BULK_ZIP = "qrni-bulk.zip";
export const DOWNLOAD_FILENAME_BULK_PDF = "qrni-bulk.pdf";
