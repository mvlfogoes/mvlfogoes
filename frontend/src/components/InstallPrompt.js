import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      if (!sessionStorage.getItem("mvl-install-dismissed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("mvl-install-dismissed", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-testid="install-prompt"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed z-[120] left-3 right-3 bottom-24 md:bottom-6 md:left-auto md:right-6 md:w-80 glass rounded-2xl p-4 border-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
        >
          <button onClick={dismiss} data-testid="install-dismiss-btn" className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-zinc-200">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flame-badge p-2.5 rounded-xl"><Download size={20} /></div>
            <div className="flex-1">
              <p className="font-outfit font-bold text-sm">Instalar MVL Fogões</p>
              <p className="text-xs text-zinc-400">Adicione à tela inicial e use como app.</p>
            </div>
          </div>
          <button onClick={install} data-testid="install-accept-btn" className="fire-btn text-white w-full mt-3 rounded-xl py-2.5 text-sm font-semibold">
            Instalar agora
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
