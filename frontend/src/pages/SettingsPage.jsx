import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { THEME } from '../theme/designSystem';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [edited, setEdited] = useState({});

  useEffect(() => {
    settingsAPI.getAll().then(({ data }) => {
      setSettings(data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => setEdited(e => ({ ...e, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edited).map(([key, value]) => ({ key, value }));
      await settingsAPI.bulkUpdate(updates);
      setSettings(s => s.map(item => edited[item.key] !== undefined ? { ...item, value: edited[item.key] } : item));
      setEdited({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const categories = [...new Set(settings.map(s => s.category))];
  const CATEGORY_ICONS = { general: '⚙️', notification: '🔔', security: '🔒', email: '📧', project: '📁', ui: '🎨' };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading settings...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><h1 style={s.title}>Settings</h1><p style={s.sub}>System configuration</p></div>
        {Object.keys(edited).length > 0 && (
          <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : `Save ${Object.keys(edited).length} Changes`}
          </button>
        )}
      </div>

      {categories.map(cat => (
        <div key={cat} style={s.section}>
          <h3 style={s.catTitle}>{CATEGORY_ICONS[cat] || '⚙️'} {cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
          <div style={s.settingsList}>
            {settings.filter(s => s.category === cat).map((setting) => (
              <div key={setting.key} style={s.settingRow}>
                <div style={s.settingInfo}>
                  <span style={s.settingKey}>{setting.label || setting.key}</span>
                  {setting.description && <span style={s.settingDesc}>{setting.description}</span>}
                  <code style={s.settingCode}>{setting.key}</code>
                </div>
                <div style={s.settingControl}>
                  {setting.dataType === 'boolean' ? (
                    <label style={s.toggle}>
                      <input type="checkbox"
                        checked={edited[setting.key] !== undefined ? edited[setting.key] : setting.value}
                        onChange={e => handleChange(setting.key, e.target.checked)}
                        disabled={!setting.isEditable}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 44, height: 24, borderRadius: 12, cursor: setting.isEditable ? 'pointer' : 'default',
                        background: (edited[setting.key] !== undefined ? edited[setting.key] : setting.value) ? '#6366f1' : '#334155',
                        position: 'relative', transition: 'background 0.2s',
                      }} onClick={() => setting.isEditable && handleChange(setting.key, !(edited[setting.key] !== undefined ? edited[setting.key] : setting.value))}>
                        <div style={{
                          position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                          left: (edited[setting.key] !== undefined ? edited[setting.key] : setting.value) ? 23 : 3,
                        }} />
                      </div>
                    </label>
                  ) : (
                    <input style={{ ...s.settingInput, opacity: !setting.isEditable ? 0.5 : 1 }}
                      type={setting.dataType === 'number' ? 'number' : setting.category === 'email' && setting.key.includes('password') ? 'password' : 'text'}
                      value={edited[setting.key] !== undefined ? edited[setting.key] : setting.value}
                      onChange={e => handleChange(setting.key, setting.dataType === 'number' ? Number(e.target.value) : e.target.value)}
                      disabled={!setting.isEditable}
                    />
                  )}
                  {!setting.isPublic && <span style={s.privateBadge}>🔒 Private</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: { maxWidth: 900, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900] },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.base },
  saveBtn: { background: THEME.colors.blue[500], color: THEME.colors.white, border: 'none', padding: `${THEME.spacing.md}px ${THEME.spacing.lg}px`, borderRadius: THEME.borderRadius.md, cursor: 'pointer', fontWeight: THEME.Typography.fontWeight.semibold },
  section: { background: THEME.colors.white, borderRadius: THEME.borderRadius.lg, border: `1px solid ${THEME.colors.gray[200]}`, marginBottom: THEME.spacing.lg, overflow: 'hidden', boxShadow: THEME.shadows.sm },
  catTitle: { margin: 0, padding: `${THEME.spacing.md}px ${THEME.spacing.xl}px`, fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.bold, color: THEME.colors.gray[900], borderBottom: `1px solid ${THEME.colors.gray[200]}`, background: THEME.colors.gray[50], textTransform: 'capitalize' },
  settingsList: { padding: `${THEME.spacing.md}px 0` },
  settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${THEME.spacing.md}px ${THEME.spacing.xl}px`, borderBottom: `1px solid ${THEME.colors.gray[100]}`, gap: THEME.spacing.lg },
  settingInfo: { display: 'flex', flexDirection: 'column', gap: THEME.spacing.xs },
  settingKey: { fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.semibold, color: THEME.colors.gray[900] },
  settingDesc: { fontSize: THEME.Typography.fontSize.sm, color: THEME.colors.gray[600] },
  settingCode: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[500], fontFamily: 'monospace' },
  settingControl: { display: 'flex', alignItems: 'center', gap: THEME.spacing.md, flexShrink: 0 },
  settingInput: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: `${THEME.spacing.sm - 1}px ${THEME.spacing.md}px`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm, outline: 'none', width: 220 },
  toggle: { cursor: 'pointer' },
  privateBadge: { fontSize: THEME.Typography.fontSize.xs, color: THEME.colors.gray[500] },
};
