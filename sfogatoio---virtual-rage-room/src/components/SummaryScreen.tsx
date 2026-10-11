import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Zap, Sparkles, Award, Trophy, Check, Gift, Share2, Copy, Home } from 'lucide-react';
import { DestructionStats } from '../types/game';

interface SummaryScreenProps {
  stats: DestructionStats;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  isTopFive: boolean;
  onSaveToLeaderboard: (playerName: string) => void;
  onDonatePlayAgain: () => void;
  onStartCustomMannequins?: () => void;
  onGoHome: () => void;
  freeCredits: number;
  earnedFreeCreditInSession: boolean;
  onUseFreeCredit: () => void;
  blitzPaymentUrl?: string;
  customPaymentUrl?: string;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  stats,
  score,
  highScore,
  isNewRecord,
  isTopFive,
  onSaveToLeaderboard,
  onDonatePlayAgain,
  onStartCustomMannequins,
  onGoHome,
  freeCredits,
  earnedFreeCreditInSession,
  onUseFreeCredit,
  blitzPaymentUrl = 'https://buy.stripe.com/00wbJ39aie8lg7F7OBbII02',
  customPaymentUrl = 'https://buy.stripe.com/aFa14p86e4xLbRp8SFbII01',
}) => {
  const [playerName, setPlayerName] = useState('');
  const [hasSavedName, setHasSavedName] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://sfogatoio.app';
  const challengeMessage = `💥 Ho totalizzato ${score.toLocaleString()} PUNTI a FOGATODIO RAGE ROOM 3D! Ho distrutto ${stats.totalSmashed} oggetti prima che scadesse il tempo! 🔨🔥 Riusciresti a far meglio?? Gioca e sfidami: ${shareUrl}`;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleShare = async (platform: 'instagram' | 'tiktok' | 'copy') => {
    await copyToClipboard(challengeMessage);

    const isMobile = typeof navigator !== 'undefined' && /mobile|iphone|android|ipad/i.test(navigator.userAgent);

    if (platform === 'instagram') {
      setShareNotice('Messaggio copiato! Incollalo nella tua Storia o DM su Instagram 📸');
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'FOGATODIO Rage Room 3D',
            text: challengeMessage,
            url: shareUrl,
          });
        } catch (e) {}
      } else {
        window.open('https://www.instagram.com/', '_blank');
      }
    } else if (platform === 'tiktok') {
      setShareNotice('Messaggio copiato! Incollalo nei commenti o DM su TikTok 🎵');
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'FOGATODIO Rage Room 3D',
            text: challengeMessage,
            url: shareUrl,
          });
        } catch (e) {}
      } else {
        window.open('https://www.tiktok.com/', '_blank');
      }
    } else {
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'FOGATODIO Rage Room 3D',
            text: challengeMessage,
            url: shareUrl,
          });
          setShareNotice('Condiviso con successo!');
        } catch (e) {
          setShareNotice('Messaggio di sfida copiato negli appunti! 📋');
        }
      } else {
        setShareNotice('Messaggio di sfida copiato negli appunti! 📋');
      }
    }

    setTimeout(() => {
      setShareNotice(null);
    }, 4500);
  };

  useEffect(() => {
    if (isNewRecord || stats.totalSmashed >= 8 || earnedFreeCreditInSession) {
      try {
        confetti({
          particleCount: earnedFreeCreditInSession ? 120 : 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f59e0b', '#06b6d4', '#10b981', '#ffffff'],
        });
      } catch (e) {}
    }
  }, [isNewRecord, stats.totalSmashed, earnedFreeCreditInSession]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSavedName) return;
    onSaveToLeaderboard(playerName.trim());
    setHasSavedName(true);
  };

  let rank = 'WARM-UP SMASHER';
  let rankTier = 'GRADE C';
  let rankDesc = 'Hai sfogato un po’ di tensione, ma la stanza è ancora quasi intatta.';

  if (score >= 6000) {
    rank = 'RAMPAGE OVERLORD';
    rankTier = 'GRADE S+';
    rankDesc = 'Devastazione apocalittica! Hai sbriciolato tutto ciò che era a portata di mano.';
  } else if (score >= 4000) {
    rank = 'UNHINGED DEMOLISHER';
    rankTier = 'GRADE A';
    rankDesc = 'Indice di distruzione formidabile. Scarica di stress completata al 100%.';
  } else if (score >= 2000) {
    rank = 'STRESS DISCHARGED';
    rankTier = 'GRADE B';
    rankDesc = 'Ottimo lavoro di demolizione: monitor, vetro, legno ed elettrodomestici frantumati.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto text-stone-100 select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-8 my-auto">
        {/* Header */}
        <div className="text-center pb-4 sm:pb-6 border-b border-stone-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-mono uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>SESSIONE {stats.tier === 'custom_mannequins' ? 'MANICHINI PERSONALIZZATI (60s)' : 'BLITZ (60s)'} · TEMPO SCADUTO</span>
          </div>

          <h2 className="font-chakra text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            REPORT <span className="text-red-500">DISTRUZIONE</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-stone-400 mt-1">
            Oggetti distrutti: <span className="text-red-400 font-bold text-base">{stats.totalSmashed}</span> bersagli polverizzati
          </p>
        </div>

        {/* Primary Scores Showcase */}
        <div className="my-4 sm:my-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-stone-950 p-3 sm:p-4 rounded-xl border border-stone-800 text-center">
            <span className="text-[10px] sm:text-[11px] font-mono text-stone-400 block uppercase">SMASHED</span>
            <span className="font-chakra text-2xl sm:text-4xl font-extrabold text-white tabular-nums">
              {stats.totalSmashed}
            </span>
          </div>

          <div className="bg-stone-950 p-3 sm:p-4 rounded-xl border border-stone-800 text-center relative overflow-hidden">
            {isNewRecord && (
              <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] sm:text-[9px] font-mono font-bold flex items-center gap-0.5 border border-amber-500/40">
                <Sparkles className="w-2.5 h-2.5" />
                <span>RECORD!</span>
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono text-stone-400 block uppercase">PUNTI TOTALI</span>
            <span className="font-chakra text-2xl sm:text-4xl font-extrabold text-amber-400 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="bg-stone-950 p-3 sm:p-4 rounded-xl border border-stone-800 text-center">
            <span className="text-[10px] sm:text-[11px] font-mono text-stone-400 block uppercase">MAX COMBO</span>
            <span className="font-chakra text-2xl sm:text-4xl font-extrabold text-cyan-400 tabular-nums">
              {stats.highestCombo > 0 ? `x${stats.highestCombo}` : 'x1'}
            </span>
          </div>
        </div>

        {/* Mannequin Stats (if available or in custom mannequins mode) */}
        {stats.mannequinStats && (
          <div className="my-3 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-left">
            <div className="font-chakra font-bold text-xs uppercase text-purple-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Report Colpi sui Manichini Personalizzati:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-stone-950/90 p-2 rounded-lg border border-red-500/40">
                <div className="text-[10px] text-red-400 font-bold uppercase">🎯 Headshot</div>
                <div className="text-xl font-chakra font-black text-white">{stats.mannequinStats.headshots}</div>
              </div>
              <div className="bg-stone-950/90 p-2 rounded-lg border border-pink-500/40">
                <div className="text-[10px] text-pink-400 font-bold uppercase">🥋 Petto</div>
                <div className="text-xl font-chakra font-black text-white">{stats.mannequinStats.torsoHits}</div>
              </div>
              <div className="bg-stone-950/90 p-2 rounded-lg border border-purple-500/40">
                <div className="text-[10px] text-purple-400 font-bold uppercase">🦵 Arti</div>
                <div className="text-xl font-chakra font-black text-white">{stats.mannequinStats.limbHits}</div>
              </div>
              <div className="bg-stone-950/90 p-2 rounded-lg border border-amber-500/40">
                <div className="text-[10px] text-amber-400 font-bold uppercase">💥 Esplosi</div>
                <div className="text-xl font-chakra font-black text-amber-300">{stats.mannequinStats.explodedCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Top 5 Hall of Fame Input Prompt */}
        {isTopFive && (
          <div className="mb-4 sm:mb-6 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-chakra font-bold text-xs uppercase text-amber-300">
                Sei entrato nella Top 5 della Classifica!
              </span>
            </div>

            {!hasSavedName ? (
              <form onSubmit={handleNameSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Inserisci il tuo Nickname..."
                  className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!playerName.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-chakra font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Salva
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Punteggio registrato nella Top 5 con successo!</span>
              </div>
            )}
          </div>
        )}

        {/* Demolition Rank Banner */}
        <div className="bg-stone-950/80 p-3.5 sm:p-4 rounded-xl border border-red-900/40 flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chakra font-black text-base sm:text-lg text-white">{rank}</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  {rankTier}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">{rankDesc}</p>
            </div>
          </div>
        </div>

        {/* Detailed Category Breakdown */}
        <div className="bg-stone-950 p-3.5 sm:p-4 rounded-xl border border-stone-800 mb-5 sm:mb-6">
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2.5">
            Dettaglio Bersagli Demoliti
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-cyan-400 font-bold text-base tabular-nums">
                {(stats.byCategory.tv || 0) + (stats.byCategory.electronics || 0)}
              </div>
              <div className="text-[9px] text-stone-400">TV, PC & Laptop</div>
            </div>
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-red-400 font-bold text-base tabular-nums">
                {(stats.byCategory.extinguisher || 0) + (stats.byCategory.lamp || 0)}
              </div>
              <div className="text-[9px] text-stone-400">Estintori & Lampade</div>
            </div>
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-amber-500 font-bold text-base tabular-nums">
                {(stats.byCategory.appliance || 0) + (stats.byCategory.printer || 0) + (stats.byCategory.telephone || 0)}
              </div>
              <div className="text-[9px] text-stone-400">Apparecchi & Telefoni</div>
            </div>
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-purple-400 font-bold text-base tabular-nums">
                {(stats.byCategory.sanitary || 0) + (stats.byCategory.guitar || 0) + (stats.byCategory.mannequin || 0)}
              </div>
              <div className="text-[9px] text-stone-400">W.C., Chitarre & Manichini</div>
            </div>
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-emerald-400 font-bold text-base tabular-nums">
                {(stats.byCategory.bottle || 0) + (stats.byCategory.carboy || 0)}
              </div>
              <div className="text-[9px] text-stone-400">Bottiglie & Boccioni</div>
            </div>
            <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-850">
              <div className="text-amber-600 font-bold text-base tabular-nums">
                {(stats.byCategory.furniture || 0) + (stats.byCategory.barrel || 0) + (stats.byCategory.tires || 0) + (stats.byCategory.plantpot || 0)}
              </div>
              <div className="text-[9px] text-stone-400">Mobili, Gomme & Piante</div>
            </div>
          </div>
        </div>

        {/* Earned Free Credit Celebration Banner */}
        {earnedFreeCreditInSession && (
          <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-600/30 via-yellow-500/30 to-amber-500/30 border-2 border-yellow-400 text-stone-100 flex items-center gap-3.5 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black shrink-0">
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="font-chakra font-black text-sm sm:text-base text-yellow-300 uppercase tracking-wider">
                🏆 OBIETTIVO RAGGIUNTO: DISTRUTTI TUTTI GLI OGGETTI!
              </div>
              <div className="text-xs font-mono text-stone-200 mt-0.5">
                Complimenti! Hai azzerato la stanza prima dello scadere del tempo. <strong className="text-emerald-400">Hai guadagnato +1 Gettone Gratis</strong>! Fino a che punteggio sarai in grado di arrivare??
              </div>
            </div>
          </div>
        )}

        {/* --- SOCIAL SHARE & CHALLENGE BANNER (IG & TIKTOK) --- */}
        <div className="mb-5 sm:mb-6 p-4 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/10 via-cyan-500/10 to-transparent pointer-events-none rounded-full blur-xl" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-chakra font-black text-xs sm:text-sm uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400">
                  SFIDA I TUOI AMICI SUI SOCIAL
                </span>
              </div>
              <p className="text-xs sm:text-sm font-chakra font-bold text-stone-200 mt-0.5">
                "Ho totalizzato {score.toLocaleString()} PTS... Riusciresti a far meglio??"
              </p>
            </div>

            {/* Platform Direct Share Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Instagram Share Button */}
              <button
                type="button"
                onClick={() => handleShare('instagram')}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-chakra font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-pink-950/40 cursor-pointer active:scale-95 transition-all"
                title="Condividi su Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </button>

              {/* TikTok Share Button */}
              <button
                type="button"
                onClick={() => handleShare('tiktok')}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-black hover:bg-stone-900 border border-stone-700 hover:border-cyan-400 text-white font-chakra font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer active:scale-95 transition-all"
                title="Condividi su TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0 text-cyan-400" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span>TikTok</span>
              </button>

              {/* Copy / Native Share Button */}
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 font-chakra font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                title="Copia Messaggio Automatico"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copia</span>
              </button>
            </div>
          </div>

          {/* Automatic Message Preview Box */}
          <div className="bg-black/60 p-2.5 rounded-lg border border-stone-800 text-[11px] font-mono text-stone-300 flex items-center justify-between gap-2">
            <span className="truncate">
              "{challengeMessage}"
            </span>
            <button
              type="button"
              onClick={() => handleShare('copy')}
              className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline shrink-0 cursor-pointer"
            >
              Copia Testo
            </button>
          </div>

          {/* Toast / Feedback Notice */}
          {shareNotice && (
            <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{shareNotice}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          {freeCredits > 0 && (
            <button
              onClick={onUseFreeCredit}
              className="w-full sm:flex-1 py-3.5 sm:py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-black font-chakra font-black text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[52px] border border-emerald-300 animate-pulse"
            >
              <Gift className="w-5 h-5 text-black shrink-0" />
              <span>Usa 1 Gettone Gratis ({freeCredits} rimasti)</span>
            </button>
          )}

          <a
            href={stats.tier === 'custom_mannequins' ? customPaymentUrl : blitzPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDonatePlayAgain}
            id="price_1UO21bQZe9HipnWgRUbGG58Z"
            data-stripe-price-id="price_1UO21bQZe9HipnWgRUbGG58Z"
            data-price-id="price_1UO21bQZe9HipnWgRUbGG58Z"
            data-stripe="true"
            className="w-full sm:flex-1 py-3.5 sm:py-4 px-5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-chakra font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-red-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Flame className="w-5 h-5 text-amber-300" />
            <span>Paga per Rigiocare ({stats.tier === 'custom_mannequins' ? '€2.00' : '€0.50'})</span>
          </a>

          {stats.tier !== 'custom_mannequins' && onStartCustomMannequins && (
            <a
              href={customPaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onStartCustomMannequins}
              className="w-full sm:flex-1 py-3.5 sm:py-4 px-5 rounded-xl bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-chakra font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-950/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[52px] border border-pink-400/50"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Dona 2€: Manichini Personalizzati</span>
              </span>
              <span className="text-[10px] font-mono text-amber-200 lowercase font-normal">
                un minuto senza conseguenze
              </span>
            </a>
          )}

          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto py-3.5 sm:py-4 px-5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white font-chakra font-bold text-xs sm:text-sm uppercase tracking-wider border border-stone-700 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
          >
            <Home className="w-4 h-4 text-stone-400" />
            <span>Torna alla Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
