import React, { useEffect, useState } from 'react';

const KeyboardShortcuts = ({
  onFocusSearch,
  onNewSession,
  onStopStreaming,
  onToggleDarkMode,
  onExport
}) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      // Allow Escape even if in input (to stop streaming/close modals)
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (onStopStreaming) onStopStreaming();
        return;
      }

      // If typing in input, ignore other shortcuts
      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            if (onFocusSearch) onFocusSearch();
            break;
          case 'n':
            e.preventDefault();
            if (onNewSession) onNewSession();
            break;
          case 'd':
            e.preventDefault();
            if (onToggleDarkMode) onToggleDarkMode();
            break;
          case 'e':
            e.preventDefault();
            if (onExport) onExport();
            break;
          case '/':
            e.preventDefault();
            setShowHelp((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFocusSearch, onNewSession, onStopStreaming, onToggleDarkMode, onExport, showHelp]);

  if (!showHelp) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    },
    modal: {
      backgroundColor: 'var(--bg-card, #F5F1EB)',
      border: '1px solid var(--border-subtle, #E0DCD5)',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
      color: 'var(--text-primary, #333)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid var(--border-subtle, #E0DCD5)',
      backgroundColor: 'var(--bg-surface, #F9F7F4)',
    },
    title: {
      margin: 0,
      fontSize: '1.2rem',
      fontWeight: 600,
      color: '#6E1A2D'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: 'var(--text-secondary, #666)',
      lineHeight: 1
    },
    content: {
      padding: '16px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tdLeft: {
      padding: '8px 0',
      textAlign: 'right',
      paddingRight: '16px',
      width: '40%'
    },
    tdRight: {
      padding: '8px 0',
      textAlign: 'left',
      fontSize: '14px'
    },
    keyBadge: {
      display: 'inline-block',
      background: 'var(--bg-surface, #FFFFFF)',
      border: '1px solid var(--border-strong, #ccc)',
      borderRadius: '4px',
      padding: '2px 6px',
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '11px',
      fontWeight: 700,
      boxShadow: '0 2px 0 var(--border-strong, #ccc)',
      color: 'var(--text-primary, #333)',
      margin: '0 2px'
    }
  };

  const Key = ({ children }) => <span style={styles.keyBadge}>{children}</span>;

  return (
    <div style={styles.overlay} onClick={() => setShowHelp(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button style={styles.closeBtn} onClick={() => setShowHelp(false)}>&times;</button>
        </div>
        <div style={styles.content}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.tdLeft}><Key>Ctrl</Key> + <Key>K</Key></td>
                <td style={styles.tdRight}>Focus search input</td>
              </tr>
              <tr>
                <td style={styles.tdLeft}><Key>Ctrl</Key> + <Key>N</Key></td>
                <td style={styles.tdRight}>New session</td>
              </tr>
              <tr>
                <td style={styles.tdLeft}><Key>Ctrl</Key> + <Key>D</Key></td>
                <td style={styles.tdRight}>Toggle dark mode</td>
              </tr>
              <tr>
                <td style={styles.tdLeft}><Key>Ctrl</Key> + <Key>E</Key></td>
                <td style={styles.tdRight}>Export current view</td>
              </tr>
              <tr>
                <td style={styles.tdLeft}><Key>Escape</Key></td>
                <td style={styles.tdRight}>Stop generating</td>
              </tr>
              <tr>
                <td style={styles.tdLeft}><Key>Ctrl</Key> + <Key>/</Key></td>
                <td style={styles.tdRight}>Show this help</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
