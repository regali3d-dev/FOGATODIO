import React, { useState } from 'react';
import { Flame, ShieldAlert, Sparkles, Volume2, VolumeX, Smartphone, Clock, RefreshCw, Trophy, Gift, Loader2, CheckCircle2, AlertCircle, ExternalLink, X, ArrowRight } from 'lucide-react';
import { LeaderboardEntry, SessionTier } from '../types/game';
import { Leaderboard } from './Leaderboard';
import { soundEngine } from '../audio/SoundEngine';

interface LandingScreenProps {
  onStartDonation: () => void;
  onStartCustomMannequinDonation: () => void;
  sessionTier: SessionTier;
  onSelectSessionTier: (tier: SessionTier) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  highScore: number;
  leaderboard: LeaderboardEntry[];
  freeCredits?: number;
  onUseFreeCredit?: () => void;
  isConnectingStripe?: boolean;
  stripeNotice?: { type: 'success' | 'cancelled' | 'info'; message: string } | null;
  onOpenStripeConfig?: () => void;
  blitzPaymentUrl?: string;
  customPaymentUrl?: string;
  onProceedCustomMannequins?: () => void;
  onProceedBlitz?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartDonation,
  onStartCustomMannequinDonation,
  sessionTier,
  onSelectSessionTier,
  isMuted,
  onToggleMute,
  highScore,
  leaderboard,
  freeCredits = 0,
  onUseFreeCredit,
  isConnectingStripe = false,
  stripeNotice = null,
  onOpenStripeConfig,
  blitzPaymentUrl = 'https://buy.stripe.com/00wbJ39aie8lg7F7OBbII02',
  customPaymentUrl = 'https://buy.stripe.com/aFa14p86e4xLbRp8SFbII01',
  onProceedCustomMannequins,
  onProceedBlitz,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rules'>('leaderboard');
  const [openedPaymentPrompt, setOpenedPaymentPrompt] = useState<'blitz' | 'custom_mannequins' | null>(null);

  const priceLabel = '€0.50';
  const durationLabel = '60 Secondi';
  const STRIPE_BLITZ_PRICE_ID = 'price_1UO21bQZe9HipnWgRUbGG58Z';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 overflow-y-auto select-none bg-radial from-stone-900 via-stone-950 to-black text-stone-100">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-800">
        <div className="w-8 shrink-0" />

        <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECORD: <span className="tabular-nums font-bold">{highScore.toLocaleString()} PTS</span></span>
            </div>
          )}
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white transition-colors min-h-[38px]"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="font-mono text-xs">{isMuted ? 'Muto' : 'Audio On'}</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 my-auto w-full max-w-4xl flex flex-col items-center text-center py-4 sm:py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 sm:mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-mono uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Ripristino Continuo Bersagli · Distruzione Senza Sosta</span>
        </div>

        {/* Title */}
        <h1 className="font-chakra text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(239,68,68,0.4)] uppercase">
          FOGAT<span className="text-red-500 animate-pulse">ODIO</span>
        </h1>

        <p className="mt-2 sm:mt-3 text-base sm:text-xl font-medium text-stone-300 max-w-xl text-balance">
          Scarica lo stress. Distruggi qualsiasi cosa. Senza conseguenze.
        </p>

        {/* Session Info Badge */}
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-stone-950/80 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <span className="font-chakra font-black text-lg text-white">€0.50</span>
          <span className="text-stone-600 font-mono">|</span>
          <span className="text-red-400 font-chakra font-bold text-xs uppercase tracking-wider">Sessione Blitz (60s)</span>
          <span className="text-stone-600 font-mono">|</span>
          <span className="text-stone-400 font-mono text-[11px]">Bersagli Infiniti</span>
        </div>

        {/* Primary CTA */}
        <div className="mt-5 flex flex-col items-center gap-3 w-full sm:w-auto px-2">
          {/* Teaser in piccolo sopra dona 1 euro */}
          <p className="text-[11px] sm:text-xs font-mono text-amber-300 font-semibold tracking-wide text-center max-w-md animate-pulse">
            distruggi tutto ed avrai un gettone gratis fino a che punteggio sarai in grado di arrivare ??
          </p>

          {freeCredits > 0 && onUseFreeCredit && (
            <button
              onClick={onUseFreeCredit}
              className="group relative w-full sm:w-auto px-6 sm:px-12 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-black font-chakra text-lg sm:text-xl font-black tracking-wider uppercase transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_35px_rgba(16,185,129,0.7)] cursor-pointer min-h-[56px] flex items-center justify-center text-center animate-pulse border-2 border-emerald-200"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <Gift className="w-6 h-6 text-black shrink-0 animate-bounce" />
                <span>USA 1 GETTONE GRATIS (Hai {freeCredits}) — GIOCA SUBITO!</span>
              </span>
            </button>
          )}

          {/* Stripe Notification Banner (if returning from Stripe or notice) */}
          {stripeNotice && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-mono max-w-md w-full animate-in fade-in duration-200 ${
                stripeNotice.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : stripeNotice.type === 'cancelled'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-stone-900 border-stone-700 text-stone-300'
              }`}
            >
              {stripeNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="flex-1">{stripeNotice.message}</span>
            </div>
          )}

          {/* Button 1: Blitz 0.50 EUR Payment */}
          <a
            href={blitzPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              soundEngine.init();
              soundEngine.resume();
              soundEngine.playWeaponSwitch();
              setOpenedPaymentPrompt('blitz');
              onStartDonation();
            }}
            id={STRIPE_BLITZ_PRICE_ID}
            data-stripe-price-id={STRIPE_BLITZ_PRICE_ID}
            data-price-id={STRIPE_BLITZ_PRICE_ID}
            data-stripe="true"
            data-amount="0.50"
            data-tier="blitz"
            className="group relative w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-chakra text-base sm:text-lg md:text-xl font-black tracking-wider uppercase transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.5)] min-h-[58px] flex flex-col items-center justify-center text-center border-2 border-amber-400/50"
          >
            <span className="flex items-center justify-center gap-2 sm:gap-2.5">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
              <span>Dona 0,50€ per Entrare</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-medium text-amber-200 tracking-wide mt-0.5">
              sessione blitz 60 secondi · checkout immediato
            </span>
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </a>

          {/* New Game Mode: Custom Mannequins 2 Euro Connected Button */}
          <a
            href={customPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              soundEngine.init();
              soundEngine.resume();
              soundEngine.playWeaponSwitch();
              setOpenedPaymentPrompt('custom_mannequins');
              onStartCustomMannequinDonation();
            }}
            data-stripe="true"
            data-amount="2.00"
            data-tier="custom_mannequins"
            className="group relative w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-chakra text-base sm:text-lg md:text-xl font-black tracking-wider uppercase transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_35px_rgba(217,70,239,0.55)] min-h-[58px] flex flex-col items-center justify-center text-center border-2 border-pink-400/50"
          >
            <span className="flex items-center justify-center gap-2 sm:gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
              <span>Dona 2€ per Manichini Personalizzati</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-medium text-amber-200 tracking-wide mt-0.5">
              un minuto senza conseguenze · 28 manichini · checkout istantaneo
            </span>
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-stone-400">
            <span>Pagamento sicuro per Blitz (0,50€) e Manichini (2,00€):</span>
            <span className="text-stone-200 font-bold">Pay</span>
            <span>·</span>
            <span className="text-blue-400 font-bold">GPay</span>
            <span>·</span>
            <span className="text-stone-300">Carta di Credito</span>
            {onOpenStripeConfig && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenStripeConfig}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  ⚙️ Configura Pagamenti
                </button>
              </>
            )}
          </div>
        </div>

        {/* Leaderboard & Rules Switcher */}
        <div className="mt-8 sm:mt-10 w-full max-w-2xl bg-stone-900/85 backdrop-blur-md rounded-2xl border border-stone-800 p-4 sm:p-5 text-left">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 text-xs font-chakra uppercase font-bold rounded-lg min-h-[36px] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Top 5 Classifica</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-chakra uppercase font-bold rounded-lg min-h-[36px] transition-colors whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Bersagli & Regole
            </button>
          </div>

          {activeTab === 'leaderboard' && (
            <div className="mt-4">
              <Leaderboard entries={leaderboard} />
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="mt-4 space-y-4">
              {/* Highlighted Promo Banner for 100% destruction */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/30 text-emerald-300 shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-chakra font-black text-sm text-emerald-300 uppercase tracking-wide">
                    🎁 PROMO EN PLEIN: DISTRUGGI TUTTI GLI OGGETTI = 1 CREDITO GRATIS!
                  </div>
                  <div className="text-[11px] font-mono text-stone-300 mt-0.5 leading-tight">
                    Se riesci a polverizzare tutti gli oggetti presenti nella stanza prima che scada il tempo, vinci all'istante <strong className="text-amber-300">+1 CREDITO GRATIS</strong> per un'altra partita omaggio!
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-stone-300">
              <div className="space-y-2">
                <div className="font-bold text-amber-400 uppercase font-chakra tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Stanze & Ripristino Continuo</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">€0.50 Blitz</span>
                  <span>60 Secondi di carica pura</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">Auto-Ripristino</span>
                  <span className="text-emerald-400 font-bold">Nuovi oggetti infiniti</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Smartphone</span>
                  <span className="text-emerald-400 font-bold">Joystick Movimento + Pulsante SMASH</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-amber-400 uppercase font-chakra tracking-wider">Bersagli Panic Room (+45 Oggetti)</div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">Manichino, W.C. & Chitarra</span>
                  <span className="text-purple-400 font-bold">+650 PTS</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">Boccione Acqua, Lampada & Estintore</span>
                  <span className="text-red-400 font-bold">+600 PTS</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">Ultrabook Laptop, TV 4K & PC</span>
                  <span className="text-cyan-400 font-bold">+520 PTS</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-1">
                  <span className="text-stone-400">Gomme, Botti di Rovere & Telefono</span>
                  <span className="text-amber-400">+480 PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Piante Terracotta, Tavoli & Bottiglie</span>
                  <span className="text-emerald-400">+350 PTS</span>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl flex items-center justify-center pt-3 sm:pt-4 border-t border-stone-800 text-[11px] text-stone-500 font-mono">
        <div className="flex items-center gap-3">
          <span>TOP 5 CLASSIFICA</span>
          <span>·</span>
          <span>ROOM 0.50€ (60s)</span>
          <span>·</span>
          <span>AUTO-RESTOCK</span>
        </div>
      </footer>

      {/* Post-click Payment Confirmation Modal Overlay */}
      {openedPaymentPrompt === 'custom_mannequins' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border-2 border-pink-500/70 rounded-2xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(217,70,239,0.45)]">
            <button
              onClick={() => setOpenedPaymentPrompt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 animate-pulse text-amber-300" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scheda di Pagamento Aperta</span>
              </div>
              <h3 className="font-chakra font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                Donazione di 2,00€ in Corso
              </h3>
              <p className="text-xs text-stone-300 font-mono mt-1.5 leading-relaxed">
                La pagina protetta di pagamento Stripe si è aperta in una nuova scheda. Completa la donazione e poi premi qui sotto per caricare il volto dei 28 manichini!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playWeaponSwitch();
                  setOpenedPaymentPrompt(null);
                  if (onProceedCustomMannequins) {
                    onProceedCustomMannequins();
                  }
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-chakra font-black text-base uppercase tracking-wider shadow-lg shadow-pink-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-pink-400/50 active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Ho Completato la Donazione → Carica Volto</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <a
                href={customPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-amber-400 hover:text-amber-300 underline py-1 inline-flex items-center justify-center gap-1.5"
              >
                <span>Riapri la pagina Stripe se non si è aperta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setOpenedPaymentPrompt(null)}
                className="text-xs font-mono text-stone-400 hover:text-stone-200 pt-1"
              >
                Annulla e Torna Indietro
              </button>
            </div>
          </div>
        </div>
      )}

      {openedPaymentPrompt === 'blitz' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border-2 border-red-500/70 rounded-2xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(239,68,68,0.45)]">
            <button
              onClick={() => setOpenedPaymentPrompt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 mx-auto flex items-center justify-center">
              <Flame className="w-7 h-7 animate-pulse text-amber-300" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scheda di Pagamento Aperta</span>
              </div>
              <h3 className="font-chakra font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                Pagamento di 0,50€ in Corso
              </h3>
              <p className="text-xs text-stone-300 font-mono mt-1.5 leading-relaxed">
                La pagina protetta di pagamento Stripe si è aperta in una nuova scheda. Completa il pagamento e poi premi qui sotto per sbloccare la camera di sfogo!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playWeaponSwitch();
                  setOpenedPaymentPrompt(null);
                  if (onProceedBlitz) {
                    onProceedBlitz();
                  }
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-chakra font-black text-base uppercase tracking-wider shadow-lg shadow-red-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/50 active:scale-[0.98]"
              >
                <Flame className="w-5 h-5 text-amber-300" />
                <span>Ho Completato il Pagamento → Gioca Subito</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <a
                href={blitzPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-amber-400 hover:text-amber-300 underline py-1 inline-flex items-center justify-center gap-1.5"
              >
                <span>Riapri la pagina Stripe se non si è aperta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setOpenedPaymentPrompt(null)}
                className="text-xs font-mono text-stone-400 hover:text-stone-200 pt-1"
              >
                Annulla e Torna Indietro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
