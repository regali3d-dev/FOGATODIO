import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  const topFive = entries.slice(0, 5);

  return (
    <div className="w-full bg-stone-950/70 rounded-xl border border-stone-800 p-3.5 sm:p-4 text-left">
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-800 mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-chakra font-bold text-xs uppercase tracking-wider text-stone-200">
            Top 5 Demolition Hall of Fame
          </span>
        </div>
        <span className="text-[10px] font-mono text-stone-500">CLASSIFICA UFFICIALE</span>
      </div>

      <div className="space-y-1.5">
        {topFive.map((entry, index) => {
          const rankColor =
            index === 0
              ? 'text-amber-400 font-black'
              : index === 1
              ? 'text-stone-300 font-bold'
              : index === 2
              ? 'text-amber-600 font-bold'
              : 'text-stone-500';

          return (
            <div
              key={entry.id || `${entry.name}-${index}`}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-stone-900/60 border border-stone-850 hover:border-stone-700 transition-colors text-xs font-mono"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-5 text-center ${rankColor}`}>#{index + 1}</span>
                <span className="font-medium text-stone-200 truncate">{entry.name}</span>
                <span className="text-[9px] text-stone-500 uppercase px-1 py-0.5 rounded bg-stone-950 border border-stone-800 hidden sm:inline">
                  {entry.tier === 'carnage' ? '3 Min (€2)' : '1 Min (€1)'}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-[11px] text-stone-400 hidden xs:inline">
                  {entry.smashed} smashed
                </span>
                <span className="font-bold text-amber-400 tabular-nums">
                  {entry.score.toLocaleString()} <span className="text-[10px] text-stone-500 font-normal">PTS</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
