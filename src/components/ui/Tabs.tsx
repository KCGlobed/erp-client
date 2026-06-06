import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div
      className={`inline-flex p-1 bg-[#FAF5FA] border border-[#F5EDF5] rounded-xl gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 select-none ${
              isActive
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-100/50'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
