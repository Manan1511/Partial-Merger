import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

/**
 * AIFeaturePanel — sidebar panel that lists AI-detected features as toggles.
 *
 * Props:
 *   aiFeatures       (object | null)  — { features, dependencies } from the AI
 *   aiLoading        (boolean)        — true while waiting for the AI response
 *   aiError          (string | null)  — error message if the AI call failed
 *   activeFeatures   (Set<string>)    — currently toggled-on feature names
 *   onToggleFeature  (function)       — called with (featureName) when user clicks a toggle
 *   onSelectAll      (function)       — selects every feature
 *   onDeselectAll    (function)       — deselects every feature
 */
const AIFeaturePanel = ({
    aiFeatures,
    aiLoading,
    aiError,
    activeFeatures,
    onToggleFeature,
    onSelectAll,
    onDeselectAll,
}) => {
    // ── Loading State ──────────────────────────────────────────────────────
    if (aiLoading) {
        return (
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing diff with AI…</span>
                </div>
            </div>
        );
    }

    // ── Error State ────────────────────────────────────────────────────────
    if (aiError) {
        return (
            <div className="p-4 border-t border-border">
                <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-xs text-red-400 flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{aiError}</span>
                </div>
            </div>
        );
    }

    // ── No Data ────────────────────────────────────────────────────────────
    if (!aiFeatures?.features) return null;

    const featureNames = Object.keys(aiFeatures.features);
    if (featureNames.length === 0) return null;

    return (
        <div className="p-4 border-t border-border">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    AI Features
                </h3>
            </div>

            {/* ── Warning Banner ────────────────────────────────────────── */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning leading-relaxed font-medium">
                    AI suggestions may be inaccurate. Always verify the selected lines manually before merging.
                </p>
            </div>

            {/* ── Feature List ──────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-3">
                {featureNames.map((name) => {
                    const isActive = activeFeatures.has(name);
                    const feature = aiFeatures.features[name];
                    const lineCount = feature?.lineIds?.length ?? 0;
                    const deps = aiFeatures.dependencies?.[name] ?? [];

                    return (
                        <button
                            key={name}
                            onClick={() => onToggleFeature(name)}
                            className="w-full group flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                            title={feature?.description ?? ''}
                        >
                            {/* Toggle pill */}
                            <div
                                className={clsx(
                                    "w-8 h-4 rounded-full relative transition-colors flex-shrink-0",
                                    isActive ? "bg-primary" : "bg-zinc-700"
                                )}
                            >
                                <div
                                    className={clsx(
                                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                                        isActive ? "left-4.5" : "left-0.5"
                                    )}
                                    style={isActive ? { left: '18px' } : { left: '2px' }}
                                />
                            </div>

                            {/* Label + metadata */}
                            <div className="flex-1 min-w-0">
                                <span
                                    className={clsx(
                                        "text-sm truncate block",
                                        isActive ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-200"
                                    )}
                                >
                                    {name}
                                </span>
                                <span className="text-[10px] text-zinc-600">
                                    {lineCount} line{lineCount !== 1 ? 's' : ''}
                                    {deps.length > 0 && (
                                        <> · depends on: {deps.join(', ')}</>
                                    )}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Bulk Actions ──────────────────────────────────────────── */}
            <div className="flex gap-2">
                <button
                    onClick={onSelectAll}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                    Select All
                </button>
                <button
                    onClick={onDeselectAll}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                    Deselect All
                </button>
            </div>
        </div>
    );
};

export default AIFeaturePanel;
