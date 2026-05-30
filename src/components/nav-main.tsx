'use client';

import { type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export function NavMain({ sections }: { sections: NavSection[] }) {
  const { pathname } = useLocation();

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="py-0">
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest px-3 mt-4 mb-1 h-auto opacity-40">
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {section.items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  className="py-2 px-3"
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
