import React from 'react';
import {
  FileText,
  BookOpen,
  Star,
  Users,
  Briefcase,
  Calendar,
  Award,
  HelpCircle,
  Heart,
  Layers,
  Globe,
  MessageSquare,
  Folder,
  Sparkles,
  Tag,
  Compass,
  Code,
  ShieldCheck,
  Package,
  Bookmark,
  type LucideIcon
} from 'lucide-react';

export const BLUEPRINT_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  FileText: { label: 'Document', icon: FileText },
  BookOpen: { label: 'Book / Article', icon: BookOpen },
  Star: { label: 'Star / Review', icon: Star },
  Users: { label: 'Team / People', icon: Users },
  Briefcase: { label: 'Portfolio / Jobs', icon: Briefcase },
  Calendar: { label: 'Event / Date', icon: Calendar },
  Award: { label: 'Award / Badge', icon: Award },
  HelpCircle: { label: 'FAQ / Help', icon: HelpCircle },
  Heart: { label: 'Heart / Cause', icon: Heart },
  Layers: { label: 'Layers / Stack', icon: Layers },
  Globe: { label: 'Global / Location', icon: Globe },
  MessageSquare: { label: 'Testimonial / Quote', icon: MessageSquare },
  Folder: { label: 'Folder / Project', icon: Folder },
  Package: { label: 'Package / Product', icon: Package },
  Bookmark: { label: 'Bookmark / Guide', icon: Bookmark },
  Sparkles: { label: 'Special / Feature', icon: Sparkles },
  Tag: { label: 'Tag / Topic', icon: Tag },
  Compass: { label: 'Compass / Destination', icon: Compass },
  Code: { label: 'Code / Tech', icon: Code },
  ShieldCheck: { label: 'Security / Verification', icon: ShieldCheck }
};

export function getBlueprintIcon(iconName?: string): LucideIcon {
  if (!iconName) return FileText;
  return BLUEPRINT_ICONS[iconName]?.icon || FileText;
}
