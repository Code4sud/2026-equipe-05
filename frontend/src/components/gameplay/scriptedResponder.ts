import { resolveOutcome } from "./simulation";
import type { Responder } from "./types";

/**
 * Répondant LOCAL du pré-alpha : il ne « comprend » rien.
 *
 * Il retrouve simplement, parmi les réponses proposées par le scénario, celle
 * que le joueur a choisie, et renvoie la réaction écrite à la main pour elle.
 * Ce n'est PAS un agent IA : les réponses des personnages sont du texte
 * préécrit dans `missions/`.
 *
 * FUTURE INTEGRATION IA :
 * remplacer ce répondant par un `Responder` qui appelle l'agent (en lui
 * transmettant `mission`, `encounter`, `character`, `transcript`, `reply`,
 * `ctx`) et renvoie un `Outcome` : réaction du personnage, conséquences,
 * variation des jauges, drapeaux. Mettre `supportsFreeText: true` pour activer
 * la saisie libre dans l'interface.
 *
 * FUTURE INTEGRATION BACKEND :
 * la session (état, historique de conversation) sera tenue côté serveur.
 */
export const scriptedResponder: Responder = {
    supportsFreeText: false,
    async respond({ encounter, reply, ctx }) {
        if (reply.kind !== "choice") {
            throw new Error("Le scénario local ne comprend que les réponses proposées.");
        }
        const option = encounter.replies.find((candidate) => candidate.id === reply.optionId);
        if (!option) throw new Error("Réponse inconnue.");
        return resolveOutcome(option, ctx);
    },
};
