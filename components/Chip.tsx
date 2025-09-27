
import React from 'react';

interface ChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ease-in-out
        ${isSelected
          ? 'bg-indigo-600 text-white shadow'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
    >
      {label}
    </button>
  );
};