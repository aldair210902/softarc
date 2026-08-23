import React from 'react';
import { Construction } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ComingSoon() {
  return (
    <div className="h-full flex items-center justify-center pt-20">
      <EmptyState 
        icon={Construction}
        title="Módulo en Construcción"
        description="Estamos trabajando en esta sección para brindarte las mejores herramientas de gestión."
      />
    </div>
  );
}
