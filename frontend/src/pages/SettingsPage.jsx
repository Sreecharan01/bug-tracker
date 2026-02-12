import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

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
  page: { maxWidth: 900, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  saveBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  section: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', marginBottom: 20, overflow: 'hidden' },
  catTitle: { margin: 0, padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#e2e8f0', borderBottom: '1px solid #334155', background: '#0f172a', textTransform: 'capitalize' },
  settingsList: { padding: '8px 0' },
  settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #0f172a', gap: 20 },
  settingInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  settingKey: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  settingDesc: { fontSize: 12, color: '#64748b' },
  settingCode: { fontSize: 11, color: '#475569', fontFamily: 'monospace' },
  settingControl: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  settingInput: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '7px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', width: 220 },
  toggle: { cursor: 'pointer' },
  privateBadge: { fontSize: 10, color: '#64748b' },
};
