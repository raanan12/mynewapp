/**
 * Maps a category's `icon` string (stored in the DB, editable from the admin
 * site) to a Lucide component. The admin UI still labels the field with
 * familiar Ionicons-style names ("heart-outline", "book-outline", ...), so
 * this accepts both the "-outline" suffix and the bare name, and falls back
 * to a generic heart for anything unrecognized rather than rendering nothing.
 */
import {
  BookOpen,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  type LucideIcon,
  Star,
  Stethoscope,
  Users,
  Utensils,
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
};

export function resolveCategoryIcon(name: string): LucideIcon {
  const key = name.replace(/-outline$/, '').trim().toLowerCase();
  return ICONS[key] ?? Heart;
}
