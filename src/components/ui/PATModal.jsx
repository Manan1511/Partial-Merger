import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const PATModal = ({ isOpen, onClose, onSave }) => {
    const [token, setToken] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-2">GitHub Authentication</h2>
                <div className="bg-white/5 p-4 rounded-lg mb-6 text-sm text-zinc-300 border border-white/10">
                    <p className="mb-2 font-semibold text-white">How to get a token:</p>
                    <ol className="list-decimal list-inside space-y-2 text-xs">
                        <li>
                            Go to <a href="https://github.com/settings/tokens/new?scopes=repo&description=Partial%20PR%20Merger" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">GitHub Settings <ExternalLink size={10} /></a>
                        </li>
                        <li>Generate a new <strong>classic</strong> token.</li>
                        <li>Ensure the code <strong>repo</strong> scope is checked.</li>
                        <li>Copy and paste the token below.</li>
                    </ol>
                </div>
                <p className="text-zinc-400 text-sm mb-6">
                    A Personal Access Token (PAT) is required to fetch diffs and merge lines.
                    It is stored locally in your browser.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Personal Access Token</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
                        />
                    </div>
                    <button
                        onClick={() => onSave(token)}
                        disabled={!token}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Token
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PATModal;
