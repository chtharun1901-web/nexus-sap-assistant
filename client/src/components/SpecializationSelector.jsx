import React, { useState } from 'react';

export const MODULE_OPTIONS = [
  { id: 'AUTO', code: 'AUTO', name: '⚡ Auto-Detect (AI Domain Engine)', badge: 'Smart', isPriority: false, color: '#6E1A2D' },
  { id: 'SAP_GTS', code: 'GTS', name: 'SAP GTS — Global Trade Services', badge: 'Tier 1 Expert', isPriority: true, color: '#7A1930' },
  { id: 'SAP_IS_RETAIL', code: 'IS-Retail', name: 'SAP IS-Retail — Industry Solution', badge: 'Tier 1 Expert', isPriority: true, color: '#8B1E3F' },
  { id: 'SAP_SD', code: 'SD', name: 'SAP SD — Sales & Distribution (O2C)', badge: 'Tier 1 Expert', isPriority: true, color: '#6E1A2D' },
  { id: 'SAP_EWM', code: 'EWM', name: 'SAP EWM — Extended Warehouse Mgmt', badge: 'Expert', isPriority: false, color: '#10B981' },
  { id: 'SAP_PP', code: 'PP', name: 'SAP PP — Production Planning & Control', badge: 'Standard', isPriority: false, color: '#8B5CF6' },
  { id: 'SAP_MM', code: 'MM', name: 'SAP MM — Materials Management (P2P)', badge: 'Standard', isPriority: false, color: '#F59E0B' },
  { id: 'SAP_FICO', code: 'FI/CO', name: 'SAP FI/CO — Financials & Controlling', badge: 'Standard', isPriority: false, color: '#06B6D4' },
  { id: 'SAP_TM', code: 'TM', name: 'SAP TM — Transportation Management', badge: 'Standard', isPriority: false, color: '#3B82F6' },
  { id: 'SAP_QM', code: 'QM', name: 'SAP QM — Quality Management', badge: 'Standard', isPriority: false, color: '#EC4899' },
  { id: 'SAP_PM', code: 'PM', name: 'SAP PM — Plant Maintenance', badge: 'Standard', isPriority: false, color: '#84CC16' },
  { id: 'SAP_BASIS', code: 'Basis', name: 'SAP Basis & System Architecture', badge: 'Standard', isPriority: false, color: '#64748B' },
  { id: 'SAP_ABAP', code: 'ABAP', name: 'SAP ABAP & Cloud Extensibility', badge: 'Standard', isPriority: false, color: '#6366F1' },
  { id: 'SAP_CROSS_MODULE', code: 'Cross-Module', name: 'SAP Cross-Module Integration Flow', badge: 'Integrated', isPriority: false, color: '#D97706' }
];

export default function SpecializationSelector({ selectedModule = 'AUTO', onSelectModule }) {
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = MODULE_OPTIONS.find(m => m.id === selectedModule) || MODULE_OPTIONS[0];

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: activeOption.isPriority ? '1px solid #7A1930' : '1px solid #CBD5E1',
            backgroundColor: activeOption.isPriority ? '#FFF1F3' : '#FFFFFF',
            color: activeOption.isPriority ? '#6E1A2D' : '#374151',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          title="Select SAP Domain Specialization or leave on Auto-Detect"
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: activeOption.color || '#6E1A2D',
              display: 'inline-block'
            }}
          />
          <span style={{ fontWeight: 600 }}>{activeOption.name}</span>
          {activeOption.badge && (
            <span
              style={{
                fontSize: 9.5,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: activeOption.isPriority ? '#7A1930' : '#E5E7EB',
                color: activeOption.isPriority ? '#FFFFFF' : '#4B5563'
              }}
            >
              {activeOption.badge}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.7, marginLeft: 2, flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {selectedModule !== 'AUTO' && (
          <button
            type="button"
            onClick={() => onSelectModule('AUTO')}
            style={{
              fontSize: 11,
              color: '#6B7280',
              padding: '3px 7px',
              borderRadius: 4,
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="Reset to Auto-Detect"
          >
            Reset
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 'calc(100% + 6px)',
              width: 310,
              maxHeight: 340,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.15), 0 6px 10px -4px rgba(0, 0, 0, 0.08)',
              zIndex: 9999,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #F3F4F6',
                fontSize: 11,
                fontWeight: 700,
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFAFA'
              }}
            >
              <span>SAP SPECIALIST DOMAIN</span>
              <span style={{ fontSize: 10, color: '#6E1A2D', fontWeight: 800 }}>8-Part Standard</span>
            </div>

            <div style={{ overflowY: 'auto', padding: '4px 0', maxHeight: 300 }}>
              {MODULE_OPTIONS.map((opt) => {
                const isSelected = opt.id === selectedModule;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectModule(opt.id);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      backgroundColor: isSelected ? '#FFF1F3' : 'transparent',
                      color: isSelected ? '#6E1A2D' : '#1F2937',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: opt.color || '#6E1A2D',
                          flexShrink: 0
                        }}
                      />
                      <span>{opt.name}</span>
                    </div>

                    <span
                      style={{
                        fontSize: 9.5,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        backgroundColor: opt.isPriority ? '#7A1930' : (isSelected ? '#E5E7EB' : '#F3F4F6'),
                        color: opt.isPriority ? '#FFFFFF' : '#4B5563'
                      }}
                    >
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
