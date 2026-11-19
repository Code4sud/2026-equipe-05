import { resolveOutcome } from "./simulation";
import type { ReplyOption, Responder } from "./types";

/**
 * Répondant LOCAL du pré-alpha : il ne « comprend » rien.
 *
 * - Réponse proposée : il renvoie la réaction écrite à la main pour elle.
 * - Phrase libre : il compte seulement des mots-clés (`ReplyOption.keywords`)
 *   pour la rapprocher d'une des réponses proposées. Si rien ne correspond, ou si
 *   deux réponses sont à égalité, il demande de reformuler.
 *
 * Ce n'est PAS un agent IA : les réactions des personnages sont du texte
 * préécrit dans `missions/`.
 *
 * FUTURE INTEGRATION IA :
 * remplacer ce répondant par un `Responder` qui appelle l'agent (en lui
 * transmettant `mission`, `encounter`, `character`, `transcript`, `reply`,
 * `ctx`) et renvoie un `Outcome` : réaction du personnage, conséquences,
 * variation des jauges, drapeaux. L'interface n'a pas à changer.
 *
 * FUTURE INTEGRATION BACKEND :
 * la session (état, historique de conversation) sera tenue côté serveur.
 */

const normalize = (text: string) =>
    ` ${text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/['’`]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()} `;

/** Les mots très courts ne comptent que s'ils sont isolés (« go », « non », « ok »). */
const hasKeyword = (text: string, keyword: string) => (keyword.length <= 3 ? text.includes(` ${keyword} `) : text.includes(keyword));

export const NOT_UNDERSTOOD =
    "Le scénario local n'a pas bien compris ta phrase : reformule avec d'autres mots, ou choisis une des réponses proposées.";

/** Rapproche une phrase libre d'une réponse proposée (ou `null`). */
export function matchFreeText(text: string, options: ReplyOption[]): ReplyOption | null {
    const normalized = normalize(text);
    const scored = options.map((option) => ({
        option,
        score: (option.keywords ?? []).filter((keyword) => hasKeyword(normalized, keyword)).length,
    }));
    const best = Math.max(...scored.map((entry) => entry.score));
    if (best <= 0) return null;
    const winners = scored.filter((entry) => entry.score === best);
    return winners.length === 1 ? winners[0].option : null;
}

export const scriptedResponder: Responder = {
    supportsFreeText: true,
    async respond({ encounter, reply, ctx }) {
        if (reply.kind === "choice") {
            const option = encounter.replies.find((candidate) => candidate.id === reply.optionId);
            if (!option) throw new Error("Réponse inconnue.");
            return resolveOutcome(option, ctx);
        }
        const matched = matchFreeText(reply.text, encounter.replies);
        if (!matched) throw new Error(NOT_UNDERSTOOD);
        return resolveOutcome(matched, ctx);
    },
};
