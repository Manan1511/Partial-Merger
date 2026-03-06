import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, Check } from 'lucide-react';
import clsx from 'clsx';
import { SUPPORTED_PROVIDERS, saveAIConfig, getAIConfig, clearAIConfig } from '../../services/ai';

/**
 * AIConfigModal — lets the user pick an AI provider and enter their API key.
 *
 * Props:
 *   isOpen   (boolean)   — whether the modal is visible
 *   onClose  (function)  — called when the user clicks X or the backdrop
 *   onSave   (function)  — called after a successful save with (provider, apiKey)
 */
const AIConfigModal = ({ isOpen, onClose, onSave }) => {
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [saveLocally, setSaveLocally] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Load existing config when modal opens
    useEffect(() => {
        if (isOpen) {
            const existing = getAIConfig();
            if (existing) {
                setProvider(existing.provider);
                setApiKey(existing.apiKey);
                setSaveLocally(true); // Was previously saved locally
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!apiKey.trim()) return;
        if (saveLocally) {
            saveAIConfig(provider, apiKey.trim());
        } else {
            clearAIConfig(); // Remove any previously saved config
        }
        if (onSave) onSave(provider, apiKey.trim(), saveLocally);
        onClose();
    };

    const handleClear = () => {
        clearAIConfig();
        setApiKey('');
        setSaveLocally(false);
        if (onSave) onSave(null, null, false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-xl font-bold mb-2">AI Assistant Setup</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Connect an LLM to automatically group PR changes into logical features.
                </p>

                <div className="space-y-5">
                    {/* ── Provider Selector ─────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">
                            Provider
                        </label>
                        <div className="flex gap-2">
                            {SUPPORTED_PROVIDERS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setProvider(p.id)}
                                    className={clsx(
                                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all text-center",
                                        provider === p.id
                                            ? "bg-primary/20 border-primary text-white"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                                    )}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Anthropic CORS warning */}
                    {provider === 'anthropic' && (
                        <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>
                                Anthropic's API may block browser requests (CORS). If you get errors, use Gemini or OpenAI instead.
                            </span>
                        </div>
                    )}

                    {/* ── API Key Input ─────────────────────────────────── */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                            API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={
                                provider === 'openai'
                                    ? 'sk-...'
                                    : provider === 'anthropic'
                                        ? 'sk-ant-...'
                                        : 'AIza...'
                            }
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
                        />
                    </div>

                    {/* ── Save Locally Checkbox ────────────────────────── */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setSaveLocally(!saveLocally)}
                    >
                        <div className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            saveLocally ? "bg-primary border-primary" : "border-zinc-600 bg-zinc-800 group-hover:border-zinc-500"
                        )}>
                            {saveLocally && <Check size={10} className="text-white" />}
                        </div>
                        <label className="text-sm text-zinc-300 select-none cursor-pointer group-hover:text-white transition-colors">
                            Store key locally (Remember me)
                        </label>
                    </div>

                    {/* ── Security Notice ──────────────────────────────── */}
                    <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                            {saveLocally
                                ? <>Your API key will be stored in your browser's localStorage. It is <strong>never</strong> sent to our servers. PS : We don't even have servers</>
                                : <>Your API key will only be kept for this session and cleared when you close the tab.</>
                            }
                        </span>
                    </div>

                    {/* ── Collapsible "How to get an API key" ───────────── */}
                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-300 hover:text-white transition-colors"
                        >
                            <span className="font-semibold">How to get an API key</span>
                            {showHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showHelp && (
                            <div className="px-4 pb-4 space-y-4 text-xs text-zinc-400">
                                {/* Gemini */}
                                <div>
                                    <p className="font-semibold text-white mb-1">Google Gemini</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            Go to{' '}
                                            <a
                                                href="https://aistudio.google.com/apikey"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                Google AI Studio <ExternalLink size={10} />
                                            </a>
                                        </li>
                                        <li>Click <strong>Create API Key</strong>.</li>
                                        <li>Copy and paste it above.</li>
                                    </ol>
                                </div>

                                {/* OpenAI */}
                                <div>
                                    <p className="font-semibold text-white mb-1">OpenAI</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            Go to{' '}
                                            <a
                                                href="https://platform.openai.com/api-keys"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                OpenAI Dashboard <ExternalLink size={10} />
                                            </a>
                                        </li>
                                        <li>Click <strong>Create new secret key</strong>.</li>
                                        <li>Copy and paste it above.</li>
                                    </ol>
                                </div>

                                {/* Anthropic */}
                                <div>
                                    <p className="font-semibold text-white mb-1">Anthropic</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            Go to{' '}
                                            <a
                                                href="https://console.anthropic.com/settings/keys"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                Anthropic Console <ExternalLink size={10} />
                                            </a>
                                        </li>
                                        <li>Click <strong>Create Key</strong>.</li>
                                        <li>Copy and paste it above.</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Action Buttons ────────────────────────────────── */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Configuration
                        </button>
                        {getAIConfig() && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
