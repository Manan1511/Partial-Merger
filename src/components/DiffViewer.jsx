import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

const DiffViewer = ({ diffFiles, selectedLines, toggleLine }) => {
    if (!diffFiles || diffFiles.length === 0) {
        return <div className="text-zinc-500 text-center mt-10">No diff parsing results.</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background p-4 space-y-8">
            {diffFiles.map((file) => (
                <div key={file.fileName} id={file.fileName} className="border border-border rounded-lg overflow-hidden bg-surface scroll-mt-20">
                    <div className="bg-zinc-900/50 px-4 py-2 border-b border-border flex justify-between items-center">
                        <span className="font-mono text-sm text-zinc-300">{file.fileName}</span>
                        <div className="flex items-center space-x-2">
                            {/* File level actions could go here */}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                {file.lines.map((line, idx) => {
                                    if (line.type === 'chunk') {
                                        return (
                                            <tr key={idx} className="bg-zinc-800/30">
                                                <td colSpan={4} className="py-1 px-4 font-mono text-xs text-zinc-500">
                                                    {line.content}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const isSelected = selectedLines.has(line.id);
                                    const isSelectable = line.type === 'addition' || line.type === 'deletion' || line.type === 'context';
                                    // Usually we only select additions/deletions for cherry-picking, or context too?
                                    // For "surgical merge", user might want to pick lines. 
                                    // If we pick a deletion, we are enforcing that deletion.
                                    // If we pick an addition, we enforce that addition.

                                    return (
                                        <tr
                                            key={line.id || idx}
                                            onClick={() => isSelectable && toggleLine(line.id)}
                                            className={clsx(
                                                "font-mono text-xs hover:bg-white/5 cursor-pointer transition-colors select-none",
                                                line.type === 'addition' && "bg-green-500/10 text-green-100",
                                                line.type === 'deletion' && "bg-red-500/10 text-red-100",
                                                line.type === 'context' && "text-zinc-400",
                                                isSelected && "bg-primary/20"
                                            )}
                                        >
                                            {/* Checkbox Column */}
                                            <td className="w-8 px-2 text-center border-r border-border/10">
                                                {isSelectable && (
                                                    <div className={clsx(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                        isSelected ? "bg-primary border-primary" : "border-zinc-600 hover:border-zinc-400"
                                                    )}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Line Numbers */}
                                            <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">
                                                {line.oldLine || ' '}
                                            </td>
                                            <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">
                                                {line.newLine || ' '}
                                            </td>

                                            {/* Code Content */}
                                            <td className="px-4 py-0.5 whitespace-pre">
                                                <span className={clsx(
                                                    line.type === 'addition' && "text-green-300",
                                                    line.type === 'deletion' && "text-red-300 opacity-70"
                                                )}>
                                                    {line.content}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DiffViewer;
