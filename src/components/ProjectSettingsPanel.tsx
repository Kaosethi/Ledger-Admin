'use client';
import React, { useEffect, useState } from 'react';

import { isoCurrencies } from './isoCurrencies';
import { creditIconMap } from './creditIconMap';

const SETTING_GROUPS = [
  {
    key: 'general',
    label: 'General',
    settings: [
      { key: 'account_display_prefix', label: 'Account Display Prefix', type: 'string', description: 'Short code for account IDs (e.g., STC). Required.' }
    ],
  },
  {
    key: 'currency',
    label: 'Currency',
    settings: [
      { key: 'currency', label: 'Currency ISO Code', type: 'iso-dropdown', description: 'Select the ISO 4217 code for this project (e.g., USD, THB, EUR). Required.' },
      { key: 'currency_symbol_override', label: 'Currency Symbol Override', type: 'string', description: 'Optional: Enter a custom symbol to use instead of the standard one.' },
      { key: 'show_currency', label: 'Show Currency', type: 'boolean', description: 'Show or hide the currency symbol/code in the UI.' },
      { key: 'credit_icon', label: 'Credit Icon', type: 'dropdown', description: 'Icon to show instead of currency when hidden (e.g., star, coin, credit_card). Optional.' },
    ],
  },
  {
    key: 'limits',
    label: 'Limits & Security',
    settings: [
      { key: 'min_transaction_amt', label: 'Minimum Transaction Amount', type: 'number', description: 'Minimum allowed transaction amount. Leave blank for no minimum.' },
      { key: 'max_transaction_amt', label: 'Maximum Transaction Amount', type: 'number', description: 'Maximum allowed transaction amount. Leave blank for no maximum.' },
      { key: 'pin_attempt_limit', label: 'PIN Attempt Limit', type: 'number', description: 'Max allowed PIN entry attempts.' },
    ],
  },
];


export default function ProjectSettingsPanel() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [project, setProject] = useState('');
  type SettingsMap = { [key: string]: string };
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setLoading(true);
      fetch(`/api/project-settings?project=${project}`)
        .then((res: Response) => res.json())
        .then((data: { settings: { key: string; value: string }[] }) => {
          const s: SettingsMap = {};
          (data.settings || []).forEach((row: { key: string; value: string }) => { s[row.key] = row.value; });
          setSettings(s);
        })
        .finally(() => setLoading(false));
    }
  }, [project]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaveStatus(null);
    setLoading(true);
    const res = await fetch('/api/project-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, key, value: settings[key] }),
    });
    setLoading(false);
    setSaveStatus(res.ok ? 'Saved!' : 'Failed to save');
    setTimeout(() => setSaveStatus(null), 1200);
  };


  return (
    <div className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-extrabold mb-6 text-blue-900 tracking-tight">Project Settings</h2>

      <div className="mb-8">
        <label className="block font-semibold mb-2 text-blue-700">Project Identifier <span className="text-orange-600">*</span></label>
        <input
          className="border-2 border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition rounded-lg w-full p-3 text-lg bg-white text-gray-900 placeholder-gray-400"
          value={project}
          onChange={e => setProject(e.target.value)}
          placeholder="e.g., STC, UNICEF"
        />
      </div>
      {project && (
        <div className="bg-white/90 rounded-xl shadow p-6 mb-6 border-l-4 border-orange-300">
          <h3 className="text-xl font-semibold mb-4 text-orange-600">Current Settings Summary</h3>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <li><span className="font-bold text-blue-900">Prefix:</span> {settings.account_display_prefix || <span className="text-gray-400">(not set)</span>}</li>
            <li><span className="font-bold text-blue-900">Currency:</span> <span className="text-teal-700">{settings.currency || <span className="text-gray-400">(not set)</span>} {isoCurrencies.find(cur => cur.code === settings.currency)?.symbol || settings.currency_symbol_override || ''}</span></li>
            <li><span className="font-bold text-blue-900">Show Currency:</span> <span className={settings.show_currency === 'true' ? 'text-green-700' : 'text-gray-500'}>{settings.show_currency === 'true' ? 'Yes' : 'No'}</span></li>
            <li className="flex items-center gap-2"><span className="font-bold text-blue-900">Credit Icon:</span> {settings.credit_icon && creditIconMap[settings.credit_icon] ? (
  <span className="inline-block align-middle">{creditIconMap[settings.credit_icon]}</span>
) : (
  <span className="text-gray-400">(none)</span>
)}</li>
          </ul>
        </div>
      )}
      {project && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Tab Navigation */}
          <div className="md:w-48 mb-4 md:mb-0">
            <div className="flex md:flex-col gap-2">
              {SETTING_GROUPS.map((group, idx) => (
                <button
                  key={group.key}
                  type="button"
                  className={`px-4 py-2 rounded-lg font-semibold text-left transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${selectedTab === idx ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-orange-100'}`}
                  onClick={() => setSelectedTab(idx)}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>
          {/* Settings Form for Selected Tab */}
          <form onSubmit={e => e.preventDefault()} className="flex-1 max-w-lg grid grid-cols-1 gap-y-6">
            {SETTING_GROUPS[selectedTab].settings.map((setting: { key: string; label: string; type: string; description: string; }) => (
              <div key={setting.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0 group">
                <div className="md:w-1/3">
                  <label className="block font-semibold text-gray-900">
                    {setting.label} {['account_display_prefix','currency'].includes(setting.key) && <span className="text-orange-600">*</span>}
                    <span className="block text-xs text-gray-500 mt-1">{setting.description}</span>
                  </label>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {setting.type === 'boolean' ? (
                    <select
                      value={settings[setting.key] || 'false'}
                      onChange={e => handleChange(setting.key, e.target.value)}
                      className="w-32 border-2 border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg p-2 bg-white transition"
                      title={setting.description}
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : setting.type === 'iso-dropdown' ? (
                    <div className="flex items-center gap-4 w-full">
  <select
    value={settings[setting.key] || ''}
    onChange={e => handleChange(setting.key, e.target.value)}
    className="min-w-[220px] flex-shrink-0 border-2 border-teal-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-lg p-2 bg-white transition"
    required
    title={setting.description}
  >
    <option value="">-- Select ISO Code --</option>
    {isoCurrencies.map(cur => (
      <option key={cur.code} value={cur.code}>{cur.code} ({cur.symbol}) - {cur.name}</option>
    ))}
  </select>
  <span className="text-lg text-orange-500 min-w-[28px] ml-2">
    {isoCurrencies.find(cur => cur.code === settings[setting.key])?.symbol || ''}
  </span>
</div>
                  ) : setting.key === 'credit_icon' ? (
                    <select
                      value={settings[setting.key] || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                      className="w-full border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg p-2 bg-white transition"
                      title={setting.description}
                    >
                      <option value="">-- Select Icon --</option>
                      <option value="star">Star</option>
                      <option value="coin">Coin</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="award">Award</option>
                      <option value="medal">Medal</option>
                      <option value="trophy">Trophy</option>
                    </select>
                  ) : (
                    <input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={settings[setting.key] || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                      className="w-full border-2 border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-lg p-2 bg-white transition"
                      required={setting.key === 'account_display_prefix'}
                      title={setting.description}
                    />
                  )}
                  <button
                    type="button"
                    className="ml-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition group-hover:scale-105 group-hover:shadow-md"
                    onClick={() => handleSave(setting.key)}
                    disabled={loading}
                  >
                    Save
                  </button>
                  {saveStatus && <span className="ml-2 text-green-600 text-xs">{saveStatus}</span>}
                </div>
              </div>
            ))}
          </form>
        </div>
      )}
    </div>
  );
}
