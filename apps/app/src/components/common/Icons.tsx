// Thin wrappers around lucide-react icons.
// Preserves the existing API (name, default sizes, extra props) so no
// consumer file changes are needed.

import {
  Copy,
  Check,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Plus,
  Link,
  FolderOpen,
  MousePointerClick,
  UserPlus,
  XCircle,
  AlertTriangle,
  EllipsisVertical,
  ArrowRight,
  Globe,
  RefreshCw,
  CheckSquare,
  Mail,
} from "lucide-react";

interface IconProps {
  size?: number;
}

export function IconCopy({ size = 12 }: IconProps) {
  return <Copy size={size} aria-hidden="true" />;
}

export function IconCheck({ size = 12, color = "currentColor" }: IconProps & { color?: string }) {
  return <Check size={size} color={color} aria-hidden="true" />;
}

export function IconPencil({ size = 14 }: IconProps) {
  return <Pencil size={size} aria-hidden="true" />;
}

export function IconTrash({ size = 14 }: IconProps) {
  return <Trash2 size={size} aria-hidden="true" />;
}

export function IconClose({ size = 18 }: IconProps) {
  return <X size={size} aria-hidden="true" />;
}

export function IconChevronDown({ size = 16 }: IconProps) {
  return <ChevronDown size={size} aria-hidden="true" />;
}

export function IconPlus({ size = 16 }: IconProps) {
  return <Plus size={size} aria-hidden="true" />;
}

export function IconLink({ size = 18 }: IconProps) {
  return <Link size={size} aria-hidden="true" />;
}

export function IconFolderOpen({
  size = 18,
  color = "currentColor",
}: IconProps & { color?: string }) {
  return <FolderOpen size={size} color={color} aria-hidden="true" />;
}

export function IconClick({ size = 12 }: IconProps) {
  return <MousePointerClick size={size} aria-hidden="true" />;
}

export function IconUserPlus({
  size = 13,
  color = "currentColor",
}: IconProps & { color?: string }) {
  return <UserPlus size={size} color={color} aria-hidden="true" />;
}

export function IconXCircle({ size = 28, color = "currentColor" }: IconProps & { color?: string }) {
  return <XCircle size={size} color={color} aria-hidden="true" />;
}

export function IconWarning({ size = 28, color = "currentColor" }: IconProps & { color?: string }) {
  return <AlertTriangle size={size} color={color} aria-hidden="true" />;
}

export function IconEllipsis({ size = 16 }: IconProps) {
  return <EllipsisVertical size={size} aria-hidden="true" />;
}

export function IconArrowRight({ size = 12 }: IconProps) {
  return <ArrowRight size={size} aria-hidden="true" />;
}

export function IconGlobe({ size = 16 }: IconProps) {
  return <Globe size={size} aria-hidden="true" />;
}

export function IconRefresh({ size = 14, className }: IconProps & { className?: string }) {
  return <RefreshCw size={size} className={className} aria-hidden="true" />;
}

export function IconCheckSquare({ size = 16 }: IconProps) {
  return <CheckSquare size={size} aria-hidden="true" />;
}

export function IconMail({ size = 16, className }: IconProps & { className?: string }) {
  return <Mail size={size} className={className} aria-hidden="true" />;
}
