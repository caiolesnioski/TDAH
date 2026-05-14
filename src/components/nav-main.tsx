'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: { title: string; url: string; disabled?: boolean }[];
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
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/50 tracking-widest px-3 mt-4 mb-1 h-auto">
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {section.items.map((item) => {
              const isParentActive =
                pathname === item.url ||
                item.items?.some((sub) => !sub.disabled && pathname === sub.url);

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isParentActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isParentActive}
                        className="py-2 px-3"
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) =>
                          subItem.disabled ? (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                className="opacity-40 cursor-not-allowed pointer-events-none"
                                title="Em breve"
                              >
                                <span>{subItem.title}</span>
                                <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                                  em breve
                                </span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
