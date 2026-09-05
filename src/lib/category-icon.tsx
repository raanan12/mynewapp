/**
 * Maps an icon key string (stored in the DB, editable from the admin site)
 * to a Lucide component. Used both for category icons and for the bottom
 * tab bar icons. The admin UI still labels category icons with familiar
 * Ionicons-style names ("heart-outline", "book-outline", ...), so this
 * accepts both the "-outline" suffix and the bare name.
 */
import {
  BookOpen,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  History,
  Home,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  Utensils,
  WalletCards,
} from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  medkit: Stethoscope,
  medical: HeartPulse,
  book: BookOpen,
  home: Home,
  star: Star,
  gift: Gift,
  people: Users,
  school: GraduationCap,
  restaurant: Utensils,
  wallet: WalletCards,
  history: History,
  shield: ShieldCheck,
  settings: Settings,
};

function normalize(name: string): string {
  return name.replace(/-outline$/, '').trim().toLowerCase();
}

/** Falls back to a generic heart for anything unrecognized rather than
 *  rendering nothing - used for category icons, which must always show
 *  something. */
export function resolveCategoryIcon(name: string): LucideIcon {
  return ICONS[normalize(name)] ?? Heart;
}

/** Returns null for an empty/unrecognized key, so the caller (tab bar) can
 *  fall back to its own hardcoded default icon instead of a generic one. */
export function tryResolveIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return ICONS[normalize(name)] ?? null;
}
