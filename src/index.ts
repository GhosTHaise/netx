// Exporter les éléments destinés à l'utilisateur final
export { useAction } from './client/useAction';

// Exporter les types nécessaires (RetryOptions si l'utilisateur veut les personnaliser)
export type { UseActionState, UseActionOptions } from './client/useAction'; // Réexporter depuis useAction si défini là
export type { RetryOptions as CoreRetryOptions } from './core/retry'; // Si besoin d'exposer les options core

// NE PAS exporter 'retry' directement sauf si c'est intentionnel.
// Le hook useAction l'utilise en interne.

// Note: Les types des actions elles-mêmes (`ActionMap`) sont accessibles via
// l'import 'ma-super-lib/actions' grâce au fichier .d.ts généré.