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
} from 'lucide-react';

/** Mirrors src/lib/category-icon.tsx in the app - keep the two in sync. */
export const ICON_OPTIONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'heart', label: 'לב', Icon: Heart },
  { key: 'medkit', label: 'רפואה', Icon: Stethoscope },
  { key: 'medical', label: 'רפואה (חילופי)', Icon: HeartPulse },
  { key: 'book', label: 'ספר', Icon: BookOpen },
  { key: 'home', label: 'בית', Icon: Home },
  { key: 'star', label: 'כוכב', Icon: Star },
  { key: 'gift', label: 'מתנה', Icon: Gift },
  { key: 'people', label: 'אנשים', Icon: Users },
  { key: 'school', label: 'לימודים', Icon: GraduationCap },
  { key: 'restaurant', label: 'מזון', Icon: Utensils },
];

function normalize(value: string): string {
  return value.replace(/-outline$/, '').trim().toLowerCase();
}

type IconPickerProps = {
  value: string;
  onChange: (key: string) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  const current = normalize(value);

  return (
    <div className="icon-picker">
      {ICON_OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          title={label}
          className={`icon-option ${current === key ? 'selected' : ''}`}
          onClick={() => onChange(key)}>
          <Icon size={20} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
