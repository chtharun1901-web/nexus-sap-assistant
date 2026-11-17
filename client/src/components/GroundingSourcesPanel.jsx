import React, { useState } from 'react';

function getSourceMeta(source) {
  const url = (source.url || '').toLowerCase();
  const title = (source.title || '').toLowerCase();
  const id = (source.citationId || '').toUpperCase();

  if (url.includes('help.sap.com')) {
    return {
      type: 'SAP Help Portal',
      badgeColor: '#0284C7',
      badgeBg: 'rgba(2, 132, 199, 0.08)',
      badgeBorder: 'rgba(2, 132, 199, 0.25)',
      icon: '📖'
    };
  }
  if (
    url.includes('me.sap.com') ||
    url.includes('support.sap.com') ||
    id.startsWith('OSS-') ||
    title.includes('sap note') ||
    title.includes('kba')
  ) {
    return {
      type: 'SAP OSS Note / KBA',
      badgeColor: '#D97706',
      badgeBg: 'rgba(217, 119, 6, 0.08)',
      badgeBorder: 'rgba(217, 119, 6, 0.25)',
      icon: '📝'
    };
  }
  if (url.includes('community.sap.com') || title.includes('sap community') || title.includes('blogs.sap')) {
    return {
      type: 'SAP Community',
      badgeColor: '#7C3AED',
      badgeBg: 'rgba(124, 58, 237, 0.08)',
      badgeBorder: 'rgba(124, 58, 237, 0.25)',
      icon: '💬'
    };
  }
  if (url.includes('api.sap.com')) {
    return {
      type: 'SAP Accelerator Hub',
      badgeColor: '#059669',
      badgeBg: 'rgba(5, 150, 105, 0.08)',
      badgeBorder: 'rgba(5, 150, 105, 0.25)',
      icon: '⚡'
    };
  }
  if (source.tier && source.tier.includes('User-Provided')) {
    return {
      type: 'User Document',
      badgeColor: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.08)',
      badgeBorder: 'rgba(99, 102, 241, 0.25)',
      icon: '📎'
    };
  }
  return {
    type: source.tier || 'Verified Reference',
    badgeColor: '#2563EB',
    badgeBg: 'rgba(37, 99, 235, 0.08)',
    badgeBorder: 'rgba(37, 99, 235, 0.25)',
    icon: '🌐'
  };
}

function resolveSourceUrl(source) {
  if (source.url && (source.url.startsWith('http://') || source.url.startsWith('https://'))) {
    return source.url;
  }
  const ossMatch = (source.citationId || '').match(/OSS[_-]?(\d+)/i) || (source.title || '').match(/Note\s*(\d{5,})/i);
  if (ossMatch) {
    return `https://me.sap.com/notes/${ossMatch[1]}`;
  }
  return null;
}

export default function GroundingSourcesPanel({ sources, searchEntryHtml }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  // Deduplicate sources by URL or citationId
  const uniqueSources = [];
  const seenUrls = new Set();
  const seenIds = new Set();

  for (const s of sources) {
    const url = resolveSourceUrl(s);
    if (url && seenUrls.has(url)) continue;
    if (s.citationId && seenIds.has(s.citationId)) continue;
    if (url) seenUrls.add(url);
    if (s.citationId) seenIds.add(s.citationId);
    uniqueSources.push(s);
  }

  if (uniqueSources.length === 0) return null;

  const visibleSources = expanded ? uniqueSources : uniqueSources.slice(0, 4);
  const hasMore = uniqueSources.length > 4;

  const handleCopy = (url, id) => {
    if (!url) return;
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(id);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (e) {}
  };

  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 20,
        padding: '16px 18px',
        borderRadius: 10,
        backgroundColor: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary, #1C1917)',
                  letterSpacing: '0.01em'
                }}
              >
                Verified Sources & Live Citations
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '1px 7px',
                  borderRadius: 12
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'inline-block'
                  }}
                />
                Google Grounded
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #78716C)', marginTop: 2 }}>
              Verified against official SAP ecosystem: Live OSS Notes, Help Portal & Community
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted, #78716C)',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            padding: '2px 8px',
            borderRadius: 6
          }}
        >
          {uniqueSources.length} {uniqueSources.length === 1 ? 'Source' : 'Sources'}
        </span>
      </div>

      {/* Google Search Entry Point Rendered Content (if available) */}
      {searchEntryHtml && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 6,
            border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))'
          }}
          dangerouslySetInnerHTML={{ __html: searchEntryHtml }}
        />
      )}

      {/* Sources Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleSources.map((source, sIdx) => {
          const meta = getSourceMeta(source);
          const resolvedUrl = resolveSourceUrl(source);
          const isCopied = copiedUrl === (source.citationId || sIdx);

          return (
            <div
              key={source.citationId || source.id || sIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.015)',
                border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))',
                transition: 'border-color 0.15s ease, background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = meta.badgeBorder;
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.025)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle, rgba(0, 0, 0, 0.06))';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.015)';
              }}
            >
              {/* Top Row: Type Pill + Citation ID + Verification Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Category Pill */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: meta.badgeColor,
                      backgroundColor: meta.badgeBg,
                      border: `1px solid ${meta.badgeBorder}`,
                      padding: '2px 8px',
                      borderRadius: 4
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.type}</span>
                  </span>

                  {/* Citation Tag */}
                  {source.citationId && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        color: 'var(--text-muted, #78716C)',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        padding: '1px 6px',
                        borderRadius: 3
                      }}
                    >
                      [{source.citationId}]
                    </span>
                  )}
                </div>

                {/* Right badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {source.release && (
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted, #78716C)' }}>
                      Rel: {source.release}
                    </span>
                  )}
                  {resolvedUrl && (
                    <button
                      type="button"
                      onClick={() => handleCopy(resolvedUrl, source.citationId || sIdx)}
                      title="Copy source link to clipboard"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'transparent',
                        border: 'none',
                        color: isCopied ? '#059669' : 'var(--text-muted, #78716C)',
                        fontSize: 10.5,
                        fontFamily: 'var(--font-mono, monospace)',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                    >
                      {isCopied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Clickable Link */}
              <div style={{ marginTop: 2 }}>
                {resolvedUrl ? (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#2563EB',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      lineHeight: 1.4
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    <span>{source.title || resolvedUrl}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                  </a>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #1C1917)' }}>
                    {source.title || 'Official SAP Reference'}
                  </span>
                )}
              </div>

              {/* URL Display if available */}
              {resolvedUrl && (
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted, #78716C)', wordBreak: 'break-all' }}>
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}
                  >
                    {resolvedUrl}
                  </a>
                </div>
              )}

              {/* Excerpt if present and informative */}
              {source.excerpt && source.excerpt !== source.title && source.excerpt !== source.url && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted, #78716C)',
                    lineHeight: 1.45,
                    marginTop: 2,
                    fontStyle: 'italic',
                    borderLeft: `2px solid ${meta.badgeBorder}`,
                    paddingLeft: 8
                  }}
                >
                  "{source.excerpt.length > 220 ? source.excerpt.slice(0, 220) + '...' : source.excerpt}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more / show less toggle */}
      {hasMore && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-muted, #78716C)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.color = 'var(--text-primary, #1C1917)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.color = 'var(--text-muted, #78716C)';
            }}
          >
            <span>{expanded ? '▲ Show less' : `▼ Show all ${uniqueSources.length} sources`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
