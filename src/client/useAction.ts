'use client'; // Indique que c'est un Client Component

import { useState, useCallback, useRef, useEffect } from 'react';
import { retry, RetryOptions, exponentialBackoff } from '../core/retry';

export interface UseActionOptions extends RetryOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseActionState<TResult> {
  data: TResult | null;
  error: Error | null;
  isLoading: boolean;
}

// TArgs est un tuple des types des arguments de l'action
// TResult est le type de la valeur de retour de la Promise de l'action
export function useAction<TArgs extends any[], TResult>(
  // La fonction action elle-même (doit être une Server Action ou une fonction appelant une API)
  actionFn: (...args: TArgs) => Promise<TResult>,
  options?: UseActionOptions
) {
  const [state, setState] = useState<UseActionState<TResult>>({
    data: null,
    error: null,
    isLoading: false,
  });

  // Garder une référence à la dernière requête pour éviter les race conditions
  const lastRequestRef = useRef(0);
  // Garder une référence aux options pour éviter les dépendances inutiles dans useCallback
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);


  const execute = useCallback(async (...args: TArgs) => {
    const requestId = Date.now();
    lastRequestRef.current = requestId;

    setState({ data: null, error: null, isLoading: true });

    try {
      // Utilise la fonction retry du core
      const result = await retry(
        () => actionFn(...args), // La fonction à exécuter/réessayer
        {
            retries: optionsRef.current?.retries,
            // Utiliser backoff par défaut si non spécifié dans les options
            delayMs: optionsRef.current?.delayMs ?? exponentialBackoff
        }
      );

      // Si une nouvelle requête a été lancée entre-temps, ignorer le résultat
      if (lastRequestRef.current !== requestId) {
        console.log("Stale request ignored.");
        return;
      }

      setState({ data: result, error: null, isLoading: false });
      optionsRef.current?.onSuccess?.(result);
      return result; // Retourner le résultat en cas de succès

    } catch (err) {
       if (lastRequestRef.current !== requestId) {
        console.log("Stale request error ignored.");
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, error: error, isLoading: false });
      optionsRef.current?.onError?.(error);
      // Ne pas relancer l'erreur ici, elle est dans l'état
      return undefined; // Indiquer l'échec
    }
  }, [actionFn]); // actionFn est la dépendance principale

  return {
    execute,
    ...state,
  };
}