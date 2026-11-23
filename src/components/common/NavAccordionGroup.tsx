import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export interface NavChildItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
}

interface NavAccordionGroupProps {
  /** Display label for the group header */
  label: string;
  /** Lucide icon component for the group header */
  icon: React.FC<{ className?: string }>;
  /** Child navigation items */
  children: NavChildItem[];
  /** Currently active view ID */
  activeView: string;
  /** Callback when a child nav item is clicked */
  onNavigate: (viewId: string) => void;
  /** Force the group open (e.g. when it contains the active route) */
  forceOpen?: boolean;
}

export const NavAccordionGroup: React.FC<NavAccordionGroupProps> = ({
  label,
  icon: GroupIcon,
  children,
  activeView,
  onNavigate,
  forceOpen,
}) => {
  const hasActiveChild = children.some((c) => c.id === activeView);
  const [isOpen, setIsOpen] = useState(hasActiveChild || !!forceOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Auto-expand when the active route moves into this group
  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children.length, isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className="mb-0.5">
      {/* Group Header */}
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors ${
          hasActiveChild
            ? 'text-indigo-700 bg-indigo-50/50'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <GroupIcon
            className={`w-3.5 h-3.5 shrink-0 ${
              hasActiveChild ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span>{label}</span>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          } ${hasActiveChild ? 'text-indigo-500' : 'text-slate-300'}`}
        />
      </button>

      {/* Collapsible Children */}
      <div
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
        className="overflow-hidden transition-all duration-200 ease-in-out"
      >
        <div ref={contentRef} className="pl-2 pt-0.5 pb-0.5">
          {children.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between pl-4 pr-2.5 py-[7px] rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-700' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded text-center shrink-0 ${
                      item.badgeColor || 'text-slate-500 bg-slate-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
