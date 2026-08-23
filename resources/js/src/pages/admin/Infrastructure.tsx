import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, Globe, Key } from 'lucide-react';
import { apiGet } from '../../lib/api';

export default function InfrastructurePage() {
  const [counts, setCounts] = useState({ servers: 0, domains: 0, credentials: 0 });

  useEffect(() => {
    Promise.all([
      apiGet<unknown[]>('/api/servers'),
      apiGet<unknown[]>('/api/domains'),
      apiGet<unknown[]>('/api/credentials'),
    ])
      .then(([servers, domains, credentials]) => {
        setCounts({
          servers: servers.length,
          domains: domains.length,
          credentials: credentials.length,
        });
      })
      .catch(() => setCounts({ servers: 0, domains: 0, credentials: 0 }));
  }, []);

  const cards = [
    { title: 'Servidores', desc: 'Gestión de VPS', count: counts.servers, icon: Server, to: '/admin/infra/servers' },
    { title: 'Dominios', desc: 'Vencimientos', count: counts.domains, icon: Globe, to: '/admin/infra/domains' },
    { title: 'Credenciales', desc: 'Bóveda segura', count: counts.credentials, icon: Key, to: '/admin/infra/credentials' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-sa-text tracking-tight">Infraestructura, Dominios y Credenciales</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-sa-panel p-6 rounded-xl border border-sa-border shadow-sm flex items-center justify-between hover:border-blue-500/40 transition-colors"
          >
            <div>
              <h3 className="text-lg font-bold text-sa-text">{card.title}</h3>
              <p className="text-sm text-sa-muted">{card.desc}</p>
              <p className="text-2xl font-extrabold text-blue-400 mt-3">{card.count}</p>
            </div>
            <card.icon className="h-8 w-8 text-blue-500/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}
