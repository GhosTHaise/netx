export interface RetryOptions {
    retries?: number; // Nombre maximum de tentatives (en plus de l'initiale)
    delayMs?: number | ((attempt: number) => number); // Délai fixe ou fonction pour backoff
  }
  
  const defaultOptions: Required<RetryOptions> = {
    retries: 3,
    delayMs: 1000, // Délai fixe par défaut
  };
  
  function getDelay(options: Required<RetryOptions>, attempt: number): number {
    if (typeof options.delayMs === 'function') {
      return options.delayMs(attempt);
    }
    return options.delayMs;
  }
  
  export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Fonction simple pour déterminer si on doit réessayer (à affiner !)
  function shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Exemples : Erreurs réseau, timeout, etc.
      // À adapter selon les erreurs spécifiques que vous voulez attraper
      const networkErrors = ['Failed to fetch', 'NetworkError'];
      if (networkErrors.some(msg => error.message.includes(msg))) return true;
    }
    // Pourrait aussi vérifier les codes status HTTP si l'erreur les contient
    // if (error?.status >= 500) return true;
    return false; // Ne pas réessayer par défaut
  }
  
  
  export async function retry<T>(
    actionFn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const mergedOptions: Required<RetryOptions> = { ...defaultOptions, ...options };
    let lastError: unknown = null;
  
    for (let attempt = 0; attempt <= mergedOptions.retries; attempt++) {
      try {
        return await actionFn();
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error); // Log basique
  
        if (attempt < mergedOptions.retries && shouldRetry(error)) {
          const waitTime = getDelay(mergedOptions, attempt + 1);
          console.log(`Retrying in ${waitTime}ms...`);
          await delay(waitTime);
        } else {
          // Si c'est la dernière tentative ou si l'erreur ne justifie pas de retry
          console.error('Action failed after all retries.');
          throw lastError; // Relancer la dernière erreur
        }
      }
    }
    // Ne devrait jamais être atteint à cause du throw, mais pour satisfaire TS
    throw lastError || new Error('Retry loop finished unexpectedly');
  }
  
  // Exemple de fonction de délai avec backoff exponentiel simple
  export function exponentialBackoff(attempt: number): number {
      return Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms, ...
  }