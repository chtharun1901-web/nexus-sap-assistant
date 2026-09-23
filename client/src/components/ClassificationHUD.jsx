import React, { useState } from 'react';

export default function ClassificationHUD({ classification }) {
  const [expanded, setExpanded] = useState(false);

  if (!classification || !classification.primaryModule) return null;

  const isPriority = ['SAP_GTS', 'SAP_IS_RETAIL', 'SAP_SD', 'GTS', 'IS_RETAIL', 'SD'].includes(classification.primaryModule);
  const confidencePercent = Math.round((classification.confidenceScore || 0.9) * 100);

  const currentTheme = isPriority
    ? { bg: '#6E1A2D', border: '#7A1930', text: '#FFFFFF', lightBg: '#FFF1F3', lightBorder: 'rgba(110, 26, 45, 0.25)' }
    : { bg: '#1F2937', border: '#374151', text: '#FFFFFF', lightBg: '#F9FAFB', lightBorder: '#E5E7EB' };

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: `1px solid ${currentTheme.lightBorder}`,
        backgroundColor: currentTheme.lightBg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        fontSize: 12
      }}
    >
      {/* Top Banner Bar */}
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderBottom: expanded ? `1px solid ${currentTheme.lightBorder}` : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Module Pill */}
          <span
            style={{
              backgroundColor: currentTheme.bg,
              color: currentTheme.text,
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                display: 'inline-block'
              }}
            />
            {classification.moduleName || classification.primaryModule.replace('SAP_', 'SAP ')}
          </span>

          {/* Sub Area */}
          {classification.subArea && (
            <span style={{ color: '#1F2937', fontWeight: 600, fontSize: 12 }}>
              {classification.subArea}
            </span>
          )}

          {/* Cross-Module Flow Indicator */}
          {classification.isCrossModule && classification.secondaryModules?.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontFamily: 'monospace',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                padding: '1px 7px',
                borderRadius: 4,
                fontWeight: 600
              }}
            >
              <span>{classification.primaryModule.replace('SAP_', '')}</span>
              {classification.secondaryModules.map((sm) => (
                <React.Fragment key={sm}>
                  <span style={{ color: '#D97706' }}>↔</span>
                  <span>{sm}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right side status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Confidence Badge */}
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: 4,
              border: confidencePercent >= 85 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              backgroundColor: confidencePercent >= 85 ? '#ECFDF5' : '#FFFBEB',
              color: confidencePercent >= 85 ? '#065F46' : '#92400E',
              fontWeight: 700
            }}
          >
            {confidencePercent}% match
          </span>

          {/* 8-Part Standard Badge */}
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: isPriority ? '1px solid #7A1930' : '1px solid #D1D5DB',
              backgroundColor: isPriority ? '#7A1930' : '#F3F4F6',
              color: isPriority ? '#FFFFFF' : '#4B5563'
            }}
          >
            8-Part Standard
          </span>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4
            }}
            title={expanded ? "Hide Specialization Details" : "Show Specialization Details"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {expanded && (
        <div style={{ padding: '10px 14px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                Business Process
              </span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{classification.businessProcess || 'General Execution'}</span>
            </div>

            {classification.tcodesInScope?.length > 0 && (
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  Detected Transactions
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {classification.tcodesInScope.map((tc) => (
                    <span key={tc} style={{ padding: '1px 6px', borderRadius: 4, backgroundColor: '#FFF1F3', border: '1px solid rgba(110, 26, 45, 0.2)', fontFamily: 'monospace', color: '#6E1A2D', fontSize: 10.5, fontWeight: 700 }}>
                      {tc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {classification.masterDataInScope?.length > 0 && (
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  Core Master Data
                </span>
                <span style={{ color: '#374151' }}>{classification.masterDataInScope.join(', ')}</span>
              </div>
            )}

            {classification.documentTypes?.length > 0 && (
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  Document Types
                </span>
                <span style={{ color: '#374151', fontFamily: 'monospace' }}>{classification.documentTypes.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
