import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Lock,
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Link2,
  AlertCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';
import { SessionTier } from '../types/game';

interface PaymentModalProps {
  sessionTier: SessionTier;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ sessionTier, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Verifica connessione Stripe in corso...');

  // Configuration state for Stripe Payment Links
  const [blitzLink, setBlitzLink] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCustomMode = sessionTier === 'custom_mannequins';
  const price = isCustomMode ? '€2.00' : '€0.50';
  const sessionName = isCustomMode
    ? 'Manichini Personalizzati (28 Bersagli · 1 Minuto)'
    : 'Sessione Blitz (60 Secondi)';

  // Check Stripe URL or fetch configuration on open
  useEffect(() => {
    let isMounted = true;

    async function checkStripeConnection() {
      setLoading(true);
      setErrorMessage(null);

      try {
        // First try to create checkout session or retrieve configured payment link
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: sessionTier }),
        });

        const data = await res.json();

        if (isMounted) {
          if (data.url) {
            setStripeUrl(data.url);
            setStatusMessage(`Pagina Stripe pronta per ${price}`);
          } else {
            // Need configuration: load current links
            loadLinks();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage('Errore di comunicazione con il server.');
          loadLinks();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    async function loadLinks() {
      try {
        const res = await fetch('/api/payment-links');
        const data = await res.json();
        if (data.links) {
          setBlitzLink(data.links.blitz || '');
          setCustomLink(data.links.custom_mannequins || '');
        }
      } catch (e) {
        console.warn('Errore lettura payment-links:', e);
      }
    }

    checkStripeConnection();

    return () => {
      isMounted = false;
    };
  }, [sessionTier]);

  const triggerRedirect = (url: string) => {
    setIsRedirecting(true);
    setStatusMessage('Reindirizzamento alla pagina di pagamento protetta Stripe...');

    setTimeout(() => {
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = url;
        } else {
          window.location.href = url;
        }
      } catch {
        window.location.href = url;
      }
    }, 400);
  };

  const handleSaveAndGoToStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLinks(true);
    setErrorMessage(null);

    const targetUrl = isCustomMode ? customLink.trim() : blitzLink.trim();

    if (!targetUrl || !targetUrl.startsWith('http')) {
      setErrorMessage('Inserisci un URL valido per la pagina di pagamento Stripe (es. https://buy.stripe.com/...)');
      setIsSavingLinks(false);
      return;
    }

    try {
      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blitz: blitzLink.trim(),
          custom_mannequins: customLink.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        soundEngine.playWeaponSwitch();
        setStripeUrl(targetUrl);
        triggerRedirect(targetUrl);
      } else {
        setErrorMessage('Impossibile salvare il link Stripe. Riprova.');
      }
    } catch (err) {
      setErrorMessage('Errore nel salvataggio. Verifica la connessione.');
    } finally {
      setIsSavingLinks(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden text-stone-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-chakra font-bold tracking-wide flex items-center gap-2">
                <span>PAGAMENTO STRIPE RICHIESTO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-normal">
                  NON GRATUITO
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                {price} EUR · {sessionName}
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-stone-200 font-bold">1x {sessionName}</div>
              <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                Stanza di distruzione 3D · 1 minuto senza conseguenze
              </div>
            </div>
            <div className="text-right shrink-0 pl-3">
              <div className="text-2xl font-mono font-bold text-amber-400">{price}</div>
              <div className="text-[10px] text-stone-500 uppercase font-mono">EUR</div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs font-mono text-stone-400">{statusMessage}</p>
            </div>
          ) : stripeUrl ? (
            /* Stripe is ready to redirect or has a connected payment page */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pagina Stripe Pronta</span>
                </div>
                <h3 className="text-sm font-semibold text-stone-200">
                  Completa il pagamento sicuro di {price} su Stripe
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                  Verrai trasferito alla pagina Stripe per pagare con carta, Apple Pay o Google Pay. Dopo il pagamento, la camera si sbloccherà automaticamente!
                </p>
              </div>

              {/* Direct Redirect Button */}
              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  soundEngine.playWeaponSwitch();
                  setIsRedirecting(true);
                }}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#635BFF] via-[#7A73FF] to-[#00D4FF] hover:from-[#5851EA] hover:to-[#00B4D8] text-white font-chakra font-black text-base sm:text-lg uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-xl shadow-[#635BFF]/30 border border-white/20 text-center"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Apertura nuova scheda...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>VAI AL PAGAMENTO ({price})</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                  </>
                )}
              </a>

              {/* Confirm / Continue Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playWeaponSwitch();
                  onSuccess();
                }}
                className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-chakra font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-emerald-400/40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Ho Completato il Pagamento → Entra Subito</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 font-mono text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Si apre in sicurezza in una nuova scheda. Zero blocchi.</span>
              </div>
            </div>
          ) : (
            /* Setup / Link Configuration required */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-chakra uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Collega la Pagina Stripe per i Pagamenti</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Il gioco <strong>non è gratuito</strong>. Per reindirizzare i giocatori alla pagina di pagamento reale Stripe, inserisci il link della pagina di pagamento (creata in 1 minuto su <a href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline font-semibold">dashboard.stripe.com/payment-links</a>).
                </p>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Link Stripe salvato! Reindirizzamento in corso...</span>
                </div>
              )}

              <form onSubmit={handleSaveAndGoToStripe} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono text-stone-300 mb-1 font-semibold flex items-center justify-between">
                    <span>Link Pagina Stripe 0,50€ (Blitz)</span>
                    <span className="text-[10px] text-stone-500 font-normal">es. https://buy.stripe.com/...</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={blitzLink}
                      onChange={(e) => setBlitzLink(e.target.value)}
                      placeholder="https://buy.stripe.com/..."
                      required={!isCustomMode}
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs font-mono placeholder-stone-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <Link2 className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-300 mb-1 font-semibold flex items-center justify-between">
                    <span>Link Pagina Stripe 2,00€ (Manichini Personalizzati)</span>
                    <span className="text-[10px] text-stone-500 font-normal">es. https://buy.stripe.com/...</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      placeholder="https://buy.stripe.com/..."
                      required={isCustomMode}
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs font-mono placeholder-stone-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    />
                    <Link2 className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 text-[11px] text-stone-400 space-y-1">
                  <div className="font-semibold text-stone-300">Come configurare in 1 minuto su Stripe:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-stone-400">
                    <li>Accedi a <span className="text-stone-300 font-mono">dashboard.stripe.com/payment-links</span></li>
                    <li>Crea un link per 0,50€ e uno per 2,00€</li>
                    <li>Incolla i due link qui sopra e clicca sul pulsante</li>
                  </ol>
                </div>

                <button
                  type="submit"
                  disabled={isSavingLinks}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-red-600 hover:from-amber-500 hover:to-red-500 text-black font-chakra font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isSavingLinks ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvataggio e apertura...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>SALVA E APRI PAGAMENTO ({price})</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer note: locked access */}
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>Stato: ACCESSO BLOCCATO</span>
            <button
              type="button"
              onClick={onCancel}
              className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
            >
              Annulla ed Esci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
