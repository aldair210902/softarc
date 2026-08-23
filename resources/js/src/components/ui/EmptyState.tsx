import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-sa-border rounded-2xl bg-sa-panel/50"
    >
      {Icon && (
        <div className="w-16 h-16 bg-sa-border rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-sa-faint" />
        </div>
      )}
      <h3 className="text-lg font-bold text-sa-text mb-2">{title}</h3>
      <p className="text-sm text-sa-muted max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
