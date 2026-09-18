import React, { useState } from 'react';
import { useThreat } from '../../context/ThreatContext';
import {
  LayoutDashboard,
  Radio,
  Network,
  TrendingUp,
  ShieldAlert,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, forecast } = useThreat();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      section: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Command Overview', icon: LayoutDashboard },
      ],
    },
    {
      section: 'MONITOR',
      items: [
        { id: 'live', label: 'Live Monitor', icon: Radio },
        { id: 'network', label: 'Network State', icon: Network },
      ],
    },
    {
      section: 'INTELLIGENCE',
      items: [
        { id: 'forecast', label: 'Forecast Horizons', icon: TrendingUp },
        { id: 'mitre', label: 'MITRE ATT&CK', icon: ShieldAlert },
        { id: 'explain', label: 'AI Explainability', icon: Cpu },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!collapsed && <div className="sidebar-section-title">{group.section}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasAlert = item.id === 'forecast' && Boolean(forecast?.warning);

              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="nav-item-icon">
                    <Icon size={18} />
                  </div>
                  {!collapsed && (
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                  {!collapsed && hasAlert && (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--threat)',
                        boxShadow: '0 0 6px var(--threat)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
