/**
 * MISSION DE TEST (pré-alpha) — alerte sur une éolienne offshore.
 *
 * Données locales et fictives, destinées uniquement à tester le gameplay sans
 * backend. Les personnages, dialogues et réactions ci-dessous sont écrits à la
 * main : ce ne sont PAS des réponses d'un agent IA.
 *
 * FUTURE INTEGRATION IA :
 * remplacer `characters`, `openingDialogue` et les `dialogue` des outcomes par
 * les personnages et répliques générés par les agents.
 *
 * FUTURE INTEGRATION BACKEND :
 * charger la mission (contexte, jauges, objectifs) depuis le scénario de la
 * session plutôt que depuis ce fichier.
 */

import type {
    ActionDefinition,
    ActionOutcome,
    DecisionDefinition,
    DialogueInput,
    EventDefinition,
    Expression,
    GameContext,
    MissionDefinition,
} from "../types";

/* ------------------------------------------------------------------ */
/* Repères de temps et de météo (fictifs)                              */
/* ------------------------------------------------------------------ */

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

const START = at(6, 40);
const DEADLINE = at(10, 30);
const WIND_LIMIT = 20; // nœuds
const WAVE_LIMIT = 1.5; // mètres
const TEAM_DURATION = 50; // minutes

type Point = [number, number];

const WIND: Point[] = [
    [at(6, 40), 25],
    [at(7, 30), 23],
    [at(8, 0), 20],
    [at(8, 30), 17],
    [at(9, 30), 15],
    [at(10, 30), 19],
    [at(11, 30), 27],
    [at(24, 0), 27],
];

const WAVES: Point[] = [
    [at(6, 40), 1.9],
    [at(7, 30), 1.7],
    [at(8, 0), 1.5],
    [at(8, 30), 1.3],
    [at(10, 30), 1.4],
    [at(11, 30), 2.2],
    [at(24, 0), 2.2],
];

function interpolate(points: Point[], x: number): number {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i += 1) {
        const [x1, y1] = points[i];
        if (x <= x1) {
            const [x0, y0] = points[i - 1];
            return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
        }
    }
    return points[points.length - 1][1];
}

const windowOpen = (ctx: GameContext) => ctx.env.wind <= WIND_LIMIT && ctx.env.wave <= WAVE_LIMIT;
const fr = (n: number) => String(n).replace(".", ",");

/* ------------------------------------------------------------------ */
/* Aides d'écriture                                                    */
/* ------------------------------------------------------------------ */

const say = (speakerId: string, text: string, expression: Expression = "neutral"): DialogueInput => ({
    speakerId,
    text,
    expression,
});

const EVIDENCE_IDS = ["exam_alarms", "exam_vibration", "exam_oil", "check_sensor", "exam_neighbors"];

const EVIDENCE_LABELS: Record<string, string> = {
    exam_alarms: "le journal d'alarmes",
    exam_vibration: "le spectre vibratoire",
    exam_oil: "l'huile et les températures",
    check_sensor: "l'état du capteur",
    exam_neighbors: "la comparaison avec E-3 et E-5",
};

const joinList = (items: string[]) =>
    items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;

const missingEvidence = (ctx: GameContext) =>
    EVIDENCE_IDS.filter((id) => !ctx.isDone(id)).map((id) => EVIDENCE_LABELS[id]);

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const actions: ActionDefinition[] = [
    /* ---- Supervision : examiner, vérifier ---- */
    {
        id: "exam_alarms",
        verb: "examine",
        toolId: "supervision",
        label: "Journal d'alarmes",
        description: "Historique des alarmes de E-4 sur les 48 dernières heures.",
        cost: 5,
        resolve: () => ({
            text: "Tu constates que l'alarme n'est pas un événement isolé.",
            tone: "good",
            deltas: { diagnostic: 15 },
            finding: {
                title: "Journal d'alarmes · 48 h",
                text:
                    "3 alarmes « vibrations multiplicateur » sur E-4 : 02:10 avant-hier, 19:45 hier, 05:52 ce matin.\n" +
                    "Elles se rapprochent. Ce n'est pas un événement isolé.",
            },
        }),
    },
    {
        id: "exam_vibration",
        verb: "examine",
        toolId: "supervision",
        label: "Analyse vibratoire (spectre)",
        description: "Décompose la vibration par fréquence pour en identifier l'origine.",
        cost: 10,
        resolve: () => ({
            text: "Le spectre pointe vers un défaut précis, pas vers une vibration quelconque.",
            tone: "good",
            deltas: { diagnostic: 25 },
            finding: {
                title: "Spectre vibratoire",
                text:
                    "Pic net à environ 3,4 fois la vitesse de rotation, avec harmoniques.\n" +
                    "C'est la signature d'un défaut de roulement sur l'arbre rapide. Un simple déséquilibre apparaîtrait à 1 fois la rotation.",
            },
        }),
    },
    {
        id: "exam_oil",
        verb: "examine",
        toolId: "supervision",
        label: "Huile et températures",
        description: "Résultats d'analyse d'huile et températures du multiplicateur.",
        cost: 5,
        resolve: () => ({
            text: "L'huile confirme que quelque chose s'use à l'intérieur.",
            tone: "good",
            deltas: { diagnostic: 20 },
            finding: {
                title: "Analyse d'huile",
                text:
                    "Particules métalliques : +60 % en 5 jours. Température d'huile : 82 °C pour 70 °C attendus.\n" +
                    "Le lubrifiant se dégrade : quelque chose frotte à l'intérieur du multiplicateur.",
            },
        }),
    },
    {
        id: "check_sensor",
        verb: "verify",
        toolId: "supervision",
        label: "Tester le capteur de vibration",
        description: "Lance l'autotest pour s'assurer que l'alarme n'est pas une fausse alerte.",
        cost: 10,
        resolve: () => ({
            text: "Le capteur est fiable : l'hypothèse de la fausse alarme perd du poids.",
            tone: "good",
            deltas: { diagnostic: 10 },
            finding: {
                title: "Autotest du capteur",
                text: "Autotest OK. Calibration valide, câblage conforme.\nLe capteur mesure bien ce qui se passe réellement.",
            },
        }),
    },
    {
        id: "exam_neighbors",
        verb: "examine",
        toolId: "supervision",
        label: "Comparer avec E-3 et E-5",
        description: "Compare E-4 aux éoliennes voisines, soumises au même vent.",
        cost: 5,
        resolve: () => ({
            text: "Le problème est propre à E-4 : ce n'est ni la météo, ni le réseau.",
            tone: "good",
            deltas: { diagnostic: 10 },
            finding: {
                title: "Comparaison avec les voisines",
                text: "E-3 et E-5 (même vent, même exposition) : vibrations normales, aucune alarme.\nLe défaut est propre à E-4.",
            },
        }),
    },

    /* ---- Documents : consulter ---- */
    {
        id: "doc_proc",
        verb: "consult",
        toolId: "documents",
        label: "PROC-SEC-04 · Mise en sécurité avant accès",
        description: "Ordre des opérations et limites d'accès à la nacelle.",
        cost: 10,
        resolve: () => ({
            text: "Tu connais maintenant l'ordre obligatoire des opérations et les limites d'accès.",
            tone: "good",
            deltas: { safety: 5 },
            setFlags: ["procedure_read"],
            finding: {
                title: "PROC-SEC-04",
                text:
                    "1. Arrêt du rotor et mise en drapeau des pales.\n" +
                    "2. Consignation des énergies (LOTO), uniquement une fois le rotor arrêté.\n" +
                    "3. Accès nacelle autorisé si vent ≤ 20 nœuds ET vagues ≤ 1,5 m.\n" +
                    "4. Équipe briefée sur le défaut et les risques avant le transfert.\n" +
                    "Aucune étape ne peut être sautée ni inversée.",
            },
        }),
    },
    {
        id: "doc_maint",
        verb: "consult",
        toolId: "documents",
        label: "MAINT-E4-02 · Fiche du multiplicateur",
        description: "Historique et durée de vie des composants du multiplicateur.",
        cost: 5,
        resolve: () => ({
            text: "L'âge du roulement rend l'hypothèse d'usure très crédible.",
            tone: "good",
            deltas: { diagnostic: 10 },
            finding: {
                title: "MAINT-E4-02",
                text:
                    "Multiplicateur de E-4 : en service depuis 6,5 ans. Durée de vie moyenne du roulement de l'arbre rapide : 7 ans.\n" +
                    "Un roulement qui s'use produit une vibration à fréquence caractéristique et libère des particules métalliques dans l'huile.",
            },
        }),
    },
    {
        id: "doc_hse",
        verb: "consult",
        toolId: "documents",
        label: "HSE-2026-01 · Consignes générales",
        description: "Règles de sécurité applicables à tout le parc.",
        cost: 5,
        resolve: () => ({
            text: "Tu sais désormais que les limites de sécurité ne se négocient pas.",
            tone: "good",
            deltas: { safety: 5 },
            setFlags: ["hse_read"],
            finding: {
                title: "HSE-2026-01",
                text:
                    "Aucune dérogation aux limites d'accès, quelle que soit la pression de production.\n" +
                    "En cas de doute : on attend. Un retard coûte de l'argent, un accident coûte une vie.\n" +
                    "Tout ordre contraire à une règle de sécurité peut, et doit, être refusé.",
            },
        }),
    },

    /* ---- Radio : communiquer ---- */
    {
        id: "radio_nadia_forecast",
        verb: "communicate",
        toolId: "radio",
        characterId: "nadia",
        tracked: true,
        label: "Demander la prévision marine",
        description: "Vent et état de la mer sur la zone, pour la matinée.",
        cost: 5,
        resolve: () => ({
            text: "Tu connais la fenêtre météo utile pour une éventuelle intervention.",
            tone: "good",
            deltas: { safety: 5 },
            setFlags: ["weather_known"],
            dialogue: [
                say("player", "Nadia, j'ai besoin de la prévision vent et mer sur E-4 pour la matinée."),
                say(
                    "nadia",
                    "Là, vent à 25 nœuds et vagues de 1,9 m. Ça faiblit : sous 20 nœuds et 1,5 m vers 8 h, et ça tient jusqu'à 10 h 30 environ. Ensuite ça se dégrade vite. Ta fenêtre utile : 8 h – 10 h 30.",
                ),
            ],
        }),
    },
    {
        id: "radio_tom_team",
        verb: "communicate",
        toolId: "radio",
        characterId: "tom",
        tracked: true,
        label: "Joindre l'équipe de maintenance",
        description: "Savoir qui est disponible et en combien de temps.",
        cost: 5,
        resolve: () => ({
            text: "L'équipe est mobilisable dès que tu donnes le feu vert.",
            tone: "good",
            setFlags: ["team_contacted"],
            dialogue: [
                say("player", "Tom, tu es dispo ? Quelle équipe et quel délai pour un transfert vers E-4 ?"),
                say(
                    "tom",
                    "Équipe de trois, bateau de transfert prêt en 45 minutes dès ton feu vert. Dis-moi ce qu'on cherche et ce qu'on doit prévoir : je ne pars pas à l'aveugle.",
                ),
            ],
        }),
    },
    {
        id: "radio_tom_brief",
        verb: "communicate",
        toolId: "radio",
        characterId: "tom",
        tracked: true,
        label: "Briefer l'équipe avant le départ",
        description: "Expliquer le défaut, les risques et les conditions d'accès.",
        cost: 10,
        availability: (ctx) => {
            if (!ctx.has("team_contacted")) return { ok: false, reason: "Joins d'abord l'équipe." };
            if (!ctx.has("diag_ok")) return { ok: false, reason: "Il te faut un diagnostic posé pour briefer l'équipe." };
            return { ok: true };
        },
        resolve: (ctx): ActionOutcome => {
            const player = say(
                "player",
                "Tom, on cherche une usure de roulement sur l'arbre rapide. Accès nacelle uniquement dans la fenêtre météo, harnais, et contrôle des énergies consignées.",
            );
            if (!ctx.has("stopped") || !ctx.has("locked")) {
                return {
                    text: "Tom refuse de briefer sur une situation qui n'est pas encore sécurisée.",
                    tone: "warn",
                    blocked: true,
                    deltas: { trust: -3 },
                    dialogue: [
                        player,
                        say(
                            "tom",
                            "Attends : la machine n'est pas encore arrêtée et consignée. Je ne briefe pas mon équipe sur une situation qui n'est pas sécurisée.",
                            "concerned",
                        ),
                    ],
                };
            }
            return {
                text: "L'équipe sait ce qu'elle cherche et comment intervenir en sécurité.",
                tone: "good",
                deltas: { safety: 10, trust: 5 },
                setFlags: ["team_briefed"],
                dialogue: [
                    player,
                    say("tom", "Reçu, c'est clair. On prépare le harnais et le matériel de contrôle. On est prêts à partir.", "happy"),
                ],
            };
        },
    },
    {
        id: "radio_marc_update",
        verb: "communicate",
        toolId: "radio",
        characterId: "marc",
        once: false,
        label: "Faire le point avec Marc",
        description: "Demander l'avis de ton responsable sur la suite (prend 5 minutes).",
        cost: 5,
        resolve: (ctx): ActionOutcome => {
            let advice: string;
            let expression: Expression = "neutral";
            if (!ctx.has("procedure_read")) {
                advice = "Avant d'agir, relis la procédure de mise en sécurité. Tout part de là.";
            } else if (ctx.doneCount(EVIDENCE_IDS) < 3) {
                advice = "Tu as encore peu de données. Regarde ce que disent le spectre, l'huile et les éoliennes voisines avant de conclure.";
            } else if (!ctx.has("diag_ok")) {
                advice = "Tu as de quoi te prononcer. Pose ton diagnostic.";
                expression = "thinking";
            } else if (!ctx.has("stopped")) {
                advice = "Diagnostic posé, et la machine tourne toujours ? Arrête-la d'abord.";
                expression = "concerned";
            } else if (!ctx.has("locked")) {
                advice = "Machine arrêtée, bien. Il faut la consigner avant tout accès humain.";
            } else if (!ctx.has("team_contacted")) {
                advice = "Machine sécurisée. Contacte Tom pour préparer une équipe.";
            } else if (!ctx.has("team_briefed")) {
                advice = "Brief l'équipe avant son départ, c'est dans la procédure.";
            } else if (!windowOpen(ctx)) {
                advice = `Tout est prêt, mais le vent est à ${ctx.env.wind} nœuds. On attend la fenêtre météo, on ne la force pas.`;
            } else if (!ctx.has("team_sent")) {
                advice = "Les conditions sont réunies. Tu peux envoyer l'équipe.";
                expression = "happy";
            } else {
                advice = "L'équipe est sur place. Il ne reste qu'à clôturer et me faire ton compte rendu.";
            }
            return {
                text: "Marc te donne son avis sur la situation.",
                tone: "neutral",
                dialogue: [say("player", "Marc, je fais le point avec toi ?"), say("marc", advice, expression)],
            };
        },
    },

    /* ---- Zone d'action : commandes ---- */
    {
        id: "cmd_diagnose",
        verb: "validate",
        toolId: "command",
        label: "Poser mon diagnostic",
        description: "Annoncer à Marc la cause probable de l'alarme.",
        cost: 0,
        once: false,
        doneWhen: (ctx) => ctx.has("diag_ok"),
        availability: (ctx) => {
            if (ctx.has("diag_ok")) return { ok: false, reason: "Diagnostic déjà posé." };
            if (ctx.doneCount(EVIDENCE_IDS) < 1) {
                return { ok: false, reason: "Examine d'abord au moins une donnée de supervision." };
            }
            return { ok: true };
        },
        resolve: () => ({
            text: "Marc attend ton diagnostic.",
            tone: "neutral",
            decisionId: "diagnosis",
            dialogue: [say("marc", "Je t'écoute : quelle est la cause probable de l'alarme ?", "thinking")],
        }),
    },
    {
        id: "cmd_stop",
        verb: "procedure",
        toolId: "command",
        label: "Demander l'arrêt à distance de E-4",
        description: "Arrêt du rotor et mise en drapeau des pales depuis le centre de contrôle.",
        cost: 5,
        once: false,
        doneWhen: (ctx) => ctx.has("stopped"),
        availability: (ctx) => (ctx.has("stopped") ? { ok: false, reason: "E-4 est déjà à l'arrêt." } : { ok: true }),
        resolve: (ctx) => ({
            text: "Le rotor est arrêté : la machine ne s'aggrave plus.",
            tone: "good",
            deltas: { safety: 15 },
            setFlags: ["stopped"],
            dialogue: [
                ctx.has("diag_ok")
                    ? say("marc", "Arrêt confirmé, pales en drapeau. La machine ne s'aggrave plus. Pense à la consignation avant tout accès.", "happy")
                    : say("marc", "Arrêt demandé par précaution. Dans le doute, on sécurise d'abord : bon réflexe.", "happy"),
            ],
        }),
    },
    {
        id: "cmd_lockout",
        verb: "procedure",
        toolId: "command",
        label: "Lancer la consignation (LOTO)",
        description: "Verrouille les énergies de E-4 avant tout accès humain.",
        cost: 15,
        once: false,
        doneWhen: (ctx) => ctx.has("locked"),
        availability: (ctx) => {
            if (ctx.has("locked")) return { ok: false, reason: "E-4 est déjà consignée." };
            if (!ctx.has("stopped")) {
                return { ok: false, reason: "E-4 tourne encore : il faut arrêter le rotor avant de consigner." };
            }
            return { ok: true };
        },
        resolve: () => ({
            text: "Les énergies sont verrouillées : l'accès humain devient possible côté énergie.",
            tone: "good",
            deltas: { safety: 15 },
            setFlags: ["locked"],
            dialogue: [say("marc", "Consignation faite, énergies verrouillées. Côté énergie, l'accès est sûr.", "happy")],
        }),
    },
    {
        id: "cmd_wait",
        verb: "wait",
        toolId: "command",
        label: "Attendre 30 minutes",
        description: "Laisse passer le temps : la météo évolue, mais la machine aussi.",
        cost: 30,
        once: false,
        resolve: (ctx) => ({
            text: windowOpen(ctx)
                ? "La fenêtre météo est ouverte : tu peux agir."
                : "Le vent et la mer sont encore hors des limites d'accès.",
            tone: "neutral",
        }),
    },
    {
        id: "cmd_send_team",
        verb: "intervene",
        toolId: "command",
        label: "Envoyer l'équipe d'inspection sur E-4",
        description: `Transfert en mer, accès nacelle et inspection du multiplicateur (≈ ${TEAM_DURATION} min).`,
        cost: TEAM_DURATION,
        availability: (ctx) =>
            ctx.remaining < TEAM_DURATION
                ? { ok: false, reason: `Pas assez de temps avant la fin de la fenêtre (${TEAM_DURATION} min nécessaires).` }
                : { ok: true },
        resolve: (ctx): ActionOutcome => {
            if (!ctx.has("diag_ok")) {
                return {
                    text: "Marc refuse de mobiliser une équipe sans diagnostic posé.",
                    tone: "warn",
                    blocked: true,
                    deltas: { trust: -5 },
                    dialogue: [
                        say("marc", "Je ne mobilise pas une équipe en mer sans diagnostic. On cherche quoi, exactement ?", "concerned"),
                    ],
                };
            }
            if (!ctx.has("stopped") || !ctx.has("locked")) {
                return {
                    text: "Marc bloque l'envoi : la machine n'est pas arrêtée et consignée.",
                    tone: "bad",
                    blocked: true,
                    deltas: { safety: -10, trust: -10 },
                    dialogue: [
                        say(
                            "marc",
                            "Tu veux envoyer quelqu'un sur une machine qui n'est pas arrêtée et consignée ? Non. Ce n'est pas négociable.",
                            "angry",
                        ),
                    ],
                };
            }
            if (!windowOpen(ctx)) {
                return {
                    text: "Le transfert est impossible : vent et mer hors des limites d'accès.",
                    tone: "warn",
                    blocked: true,
                    deltas: { trust: -5 },
                    dialogue: [
                        say(
                            "nadia",
                            `Vent à ${ctx.env.wind} nœuds, vagues de ${fr(ctx.env.wave)} m : c'est hors limites. Le bateau ne part pas.`,
                            "concerned",
                        ),
                    ],
                };
            }
            return ctx.has("team_briefed")
                ? {
                      text: "L'équipe a transféré en sécurité et confirmé le défaut.",
                      tone: "good",
                      deltas: { safety: 10 },
                      setFlags: ["team_sent"],
                      dialogue: [
                          say(
                              "tom",
                              "On est sur E-4. Roulement de l'arbre rapide confirmé : bague extérieure écaillée. Heureusement qu'on a arrêté à temps. On prépare le remplacement.",
                              "happy",
                          ),
                      ],
                  }
                : {
                      text: "L'équipe est partie sans brief : l'inspection a eu lieu, mais avec moins de maîtrise.",
                      tone: "warn",
                      deltas: { safety: -10, trust: -5 },
                      setFlags: ["team_sent", "unbriefed"],
                      dialogue: [
                          say(
                              "tom",
                              "On est sur place, mais je n'avais pas toutes les informations au départ. Ça s'est joué à peu de choses.",
                              "concerned",
                          ),
                      ],
                  };
        },
    },
    {
        id: "cmd_close",
        verb: "validate",
        toolId: "command",
        label: "Clôturer l'intervention et rendre compte",
        description: "Valider la fin d'intervention et faire ton compte rendu à Marc.",
        cost: 10,
        availability: (ctx) =>
            ctx.has("team_sent") ? { ok: true } : { ok: false, reason: "Aucune intervention à clôturer pour l'instant." },
        resolve: (ctx): ActionOutcome => {
            const clean =
                ctx.has("diag_ok") &&
                !ctx.has("unbriefed") &&
                !ctx.has("auto_trip") &&
                !ctx.has("escalated") &&
                ctx.indicators.safety >= 70 &&
                ctx.indicators.trust >= 50;
            return clean
                ? {
                      text: "Compte rendu validé. Intervention réussie.",
                      tone: "good",
                      deltas: { trust: 5 },
                      dialogue: [
                          say("player", "Marc, intervention terminée : roulement confirmé, machine sécurisée, équipe rentrée."),
                          say("marc", "Excellent. Diagnostic argumenté, sécurité respectée, équipe briefée : voilà comment on fait.", "happy"),
                      ],
                      end: {
                          status: "success",
                          reason: "E-4 a été sécurisée, le défaut confirmé et l'équipe est intervenue dans les règles.",
                      },
                  }
                : {
                      text: "Compte rendu validé, mais l'intervention a pris des risques en route.",
                      tone: "warn",
                      deltas: { trust: 3 },
                      dialogue: [
                          say("player", "Marc, intervention terminée. Le défaut est confirmé."),
                          say(
                              "marc",
                              "C'est fait, mais on a pris des risques ou laissé la situation se dégrader en route. On en reparle à froid.",
                              "neutral",
                          ),
                      ],
                      end: {
                          status: "partial",
                          reason: "Le défaut est traité, mais des décisions ont fragilisé la sécurité ou la confiance de l'équipe.",
                      },
                  };
        },
    },
];

/* ------------------------------------------------------------------ */
/* Décisions                                                           */
/* ------------------------------------------------------------------ */

const decisions: DecisionDefinition[] = [
    {
        id: "diagnosis",
        characterId: "marc",
        title: "Diagnostic",
        prompt: "Quelle est, selon toi, la cause probable de l'alarme sur E-4 ?",
        options: [
            {
                id: "bearing",
                verb: "validate",
                label: "Usure d'un roulement du multiplicateur",
                hint: "Défaut mécanique interne.",
                cost: 5,
                resolve: (ctx): ActionOutcome => {
                    const strong = ctx.doneCount(EVIDENCE_IDS) >= 3 && (ctx.isDone("exam_vibration") || ctx.isDone("exam_oil"));
                    return strong
                        ? {
                              text: "Diagnostic solide, appuyé par plusieurs données concordantes.",
                              tone: "good",
                              deltas: { diagnostic: 20, trust: 10 },
                              setFlags: ["diag_ok"],
                              dialogue: [
                                  say("player", "Je pense à une usure de roulement sur l'arbre rapide. Les données concordent."),
                                  say("marc", "Convaincant. Tu t'appuies sur des mesures, pas sur une intuition. On part là-dessus.", "happy"),
                              ],
                          }
                        : {
                              text: "Diagnostic plausible, mais trop peu étayé.",
                              tone: "warn",
                              deltas: { diagnostic: 5 },
                              setFlags: ["diag_ok", "diag_weak"],
                              dialogue: [
                                  say("player", "Je pense à une usure de roulement sur l'arbre rapide."),
                                  say(
                                      "marc",
                                      "C'est cohérent, mais tu t'appuies sur trop peu d'éléments. Un diagnostic, ça se prouve. Je te suis, mais sois prudent.",
                                      "thinking",
                                  ),
                              ],
                          };
                },
            },
            {
                id: "false_alarm",
                verb: "validate",
                label: "Fausse alarme : capteur défaillant",
                hint: "L'alarme ne reflète pas un vrai problème.",
                cost: 5,
                resolve: (ctx): ActionOutcome => {
                    const missing = missingEvidence(ctx);
                    return {
                        text: "Diagnostic rejeté : tu écartes une alarme récurrente un peu vite.",
                        tone: "bad",
                        deltas: { diagnostic: -15, trust: -10 },
                        setFlags: ["diag_wrong"],
                        dialogue: [
                            say("player", "Je pense à une fausse alarme : le capteur doit être défaillant."),
                            say(
                                "marc",
                                missing.length > 0
                                    ? `Tu écartes une alarme récurrente sans avoir regardé ${joinList(missing)}. Reprends tes données.`
                                    : "Avec toutes ces données, tu écartes l'alarme ? Relis tes résultats : le capteur est bon et l'huile se dégrade.",
                                "concerned",
                            ),
                        ],
                    };
                },
            },
            {
                id: "imbalance",
                verb: "validate",
                label: "Déséquilibre des pales (givre, encrassement)",
                hint: "Les pales ne sont plus bien équilibrées.",
                cost: 5,
                resolve: (ctx): ActionOutcome => ({
                    text: "Diagnostic rejeté : il n'explique pas toutes les observations.",
                    tone: "bad",
                    deltas: { diagnostic: -10, trust: -8 },
                    setFlags: ["diag_wrong"],
                    dialogue: [
                        say("player", "Je pense à un déséquilibre des pales, peut-être du givre ou de l'encrassement."),
                        say(
                            "marc",
                            ctx.isDone("exam_vibration")
                                ? "Un déséquilibre vibrerait à la fréquence de rotation. Ton spectre dit autre chose. Reprends-le."
                                : "Tu n'as pas regardé le spectre vibratoire pour l'affirmer. Et un déséquilibre n'explique pas les particules dans l'huile.",
                            "concerned",
                        ),
                    ],
                }),
            },
        ],
    },
    {
        id: "production_pressure",
        characterId: "marc",
        title: "Pression de la production",
        prompt:
            "La direction de la production veut remettre E-4 en service à 50 % de puissance jusqu'à demain, le temps de planifier la réparation. Quelle est ta décision ?",
        options: [
            {
                id: "accept",
                verb: "accept",
                label: "Accepter la remise en service à 50 %",
                hint: "La production reprend, la machine continue de tourner.",
                resolve: (): ActionOutcome => ({
                    text: "E-4 repart en production à puissance réduite, avec un défaut non traité.",
                    tone: "bad",
                    deltas: { safety: -35, trust: 5 },
                    setFlags: ["degraded_mode"],
                    clearFlags: ["stopped", "locked"],
                    dialogue: [
                        say("player", "D'accord, on la remet en service à 50 % jusqu'à demain."),
                        say("marc", "Bien, je préviens la direction. On garde un œil sur les vibrations.", "neutral"),
                    ],
                }),
            },
            {
                id: "refuse",
                verb: "refuse",
                label: "Refuser et argumenter",
                hint: "Tenir ta position face à la pression.",
                resolve: (ctx): ActionOutcome => {
                    const solid = ctx.indicators.diagnostic >= 50;
                    return solid
                        ? {
                              text: "Tu refuses avec des données solides : Marc défend ta position.",
                              tone: "good",
                              deltas: { trust: 10, safety: 5 },
                              setFlags: ["pressure_resisted"],
                              dialogue: [
                                  say("player", "Je refuse. Les mesures montrent un défaut de roulement : redémarrer, c'est risquer la casse."),
                                  say("marc", "Compris, tu as des données solides. Je défends ta position auprès de la direction.", "happy"),
                              ],
                          }
                        : {
                              text: "Tu refuses, mais sans pouvoir l'appuyer sur des preuves.",
                              tone: "warn",
                              deltas: { trust: -5, safety: 5 },
                              setFlags: ["pressure_resisted"],
                              dialogue: [
                                  say("player", "Je refuse, je ne le sens pas."),
                                  say(
                                      "marc",
                                      "Je ne peux pas défendre un « je ne le sens pas » face à la direction. La prochaine fois, ramène des preuves.",
                                      "concerned",
                                  ),
                              ],
                          };
                },
            },
        ],
    },
];

/* ------------------------------------------------------------------ */
/* Événements                                                          */
/* ------------------------------------------------------------------ */

const events: EventDefinition[] = [
    {
        id: "ev_pressure",
        when: (ctx) => ctx.clock >= at(7, 20) && !ctx.has("team_sent"),
        resolve: (ctx) => ({
            title: "Appel de la direction",
            text: "La direction de la production appuie pour remettre E-4 en service.",
            tone: "warn",
            decisionId: "production_pressure",
            dialogue: [
                say(
                    "marc",
                    ctx.has("stopped")
                        ? "J'ai la direction de la production en ligne. Ils veulent qu'on redémarre E-4 à 50 % jusqu'à demain. Je ne peux pas décider à ta place : t'en dis quoi ?"
                        : "J'ai la direction de la production en ligne. Ils veulent maintenir E-4 en service à 50 % jusqu'à demain. T'en dis quoi ?",
                    "concerned",
                ),
            ],
        }),
    },
    {
        id: "ev_window",
        when: (ctx) => ctx.clock >= at(8, 0),
        resolve: (ctx) => ({
            title: "Météo",
            text: "La fenêtre d'accès s'ouvre sur la zone du parc.",
            tone: "good",
            dialogue: [
                say(
                    "nadia",
                    `Alerte météo : le vent passe à ${ctx.env.wind} nœuds et les vagues à ${fr(ctx.env.wave)} m. La fenêtre d'accès est ouverte.`,
                    "happy",
                ),
            ],
        }),
    },
    {
        id: "ev_escalation",
        when: (ctx) => ctx.clock >= at(8, 15) && !ctx.has("stopped"),
        resolve: () => ({
            title: "Alarme niveau 2",
            text: "Les vibrations de E-4 augmentent : elle tourne toujours.",
            tone: "bad",
            deltas: { safety: -10, trust: -5 },
            setFlags: ["escalated"],
            dialogue: [
                say("marc", "Alarme niveau 2 sur E-4 : les vibrations ont augmenté de 40 %. Elle tourne toujours ! Il faut l'arrêter.", "angry"),
            ],
        }),
    },
    {
        id: "ev_auto_trip",
        when: (ctx) =>
            (!ctx.has("stopped") && ctx.clock >= at(9, 0)) || (ctx.has("degraded_mode") && ctx.since("degraded_mode") >= 30),
        resolve: () => ({
            title: "Arrêt automatique de sécurité",
            text: "Le système coupe E-4 de lui-même : la situation a été subie, pas maîtrisée.",
            tone: "bad",
            deltas: { safety: -20, trust: -15 },
            setFlags: ["stopped", "auto_trip"],
            clearFlags: ["degraded_mode"],
            dialogue: [
                say("marc", "Arrêt automatique de sécurité sur E-4. On a laissé la machine aller trop loin : c'est le système qui a décidé à notre place.", "angry"),
            ],
        }),
    },
];

/* ------------------------------------------------------------------ */
/* Mission                                                             */
/* ------------------------------------------------------------------ */

export const offshoreTurbineMission: MissionDefinition = {
    id: "offshore-gearbox-alert",
    title: "Alerte multiplicateur · E-4",
    role: "Technicien·ne de maintenance éolienne offshore (astreinte)",
    sector: "Énergie · éolien en mer",
    location: "Parc éolien offshore · éolienne E-4",
    summary:
        "Une alarme de vibrations est active sur le multiplicateur de l'éolienne E-4. Tu dois comprendre ce qui se passe, protéger les personnes et la machine, puis décider si et quand envoyer une équipe en mer.",
    startClock: START,
    deadlineClock: DEADLINE,

    briefing: {
        eyebrow: "PRISE DE POSTE · 06:40",
        headline: "Tu prends l'astreinte au centre de supervision du parc",
        narrative: [
            "Il est 6 h 40. Le jour se lève sur la mer. Une alarme de vibrations vient de se déclencher sur le multiplicateur de l'éolienne E-4, à plusieurs kilomètres des côtes.",
            "Ton responsable, Marc, est en ligne. À la radio, tu peux joindre la météo marine et le chef d'équipe de maintenance.",
        ],
        roleSummary:
            "Un technicien de maintenance éolienne ne fait pas que réparer : il diagnostique, applique des procédures de sécurité strictes, coordonne des équipes et décide au bon moment, souvent sous contrainte de météo et de production.",
        objectives: [
            "Comprendre l'origine de l'alerte",
            "Protéger les personnes et la machine",
            "Décider si et quand envoyer une équipe en mer",
            "Rendre compte à ton responsable",
        ],
        howToPlay: [
            { title: "Observe", text: "Rien n'est donné d'avance. Explore tes outils et interroge tes interlocuteurs." },
            { title: "Agis", text: "Chaque vérification prend du temps, et le temps est compté." },
            { title: "Assume", text: "Tes décisions ont des conséquences sur la sécurité, la confiance et le résultat." },
        ],
    },

    indicators: [
        { id: "safety", label: "Sécurité", meaning: "Maîtrise des risques pour les personnes et la machine.", icon: "shield", initial: 70 },
        { id: "diagnostic", label: "Diagnostic", meaning: "Qualité de ta compréhension du problème, fondée sur des données.", icon: "gauge", initial: 10 },
        { id: "trust", label: "Confiance", meaning: "Confiance que Marc et l'équipe t'accordent.", icon: "handshake", initial: 50 },
    ],

    characters: [
        { id: "marc", name: "Marc", role: "Responsable d'exploitation", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
        { id: "nadia", name: "Nadia", role: "Prévisionniste météo marine", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
        { id: "tom", name: "Tom", role: "Chef d'équipe maintenance", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
    ],

    openingDialogue: [
        say(
            "marc",
            "Salut. Alarme de vibrations sur le multiplicateur d'E-4 depuis 5 h 52, et le vent est à 25 nœuds. Je ne veux aucune intervention avant d'y voir clair. Tu as la main : explore, vérifie, et tiens-moi au courant.",
            "concerned",
        ),
    ],

    tools: [
        {
            id: "supervision",
            label: "Supervision",
            subtitle: "SCADA · E-4",
            icon: "monitor",
            kind: "dashboard",
            description: "Poste de supervision du parc. Examine les données de E-4 : chaque vérification prend du temps.",
            placement: "workspace",
        },
        {
            id: "documents",
            label: "Documents",
            subtitle: "Procédures",
            icon: "file",
            kind: "documents",
            description: "Dossier technique et procédures. Ouvre un document pour en découvrir le contenu.",
            placement: "workspace",
        },
        {
            id: "radio",
            label: "Radio",
            subtitle: "Canal 04",
            icon: "radio",
            kind: "radio",
            description: "Joins tes interlocuteurs. Chaque échange prend du temps.",
            placement: "workspace",
        },
        {
            id: "command",
            label: "Commandes",
            subtitle: "Décisions",
            icon: "wrench",
            kind: "commands",
            description: "Décisions et commandes sur la machine.",
            placement: "actions",
        },
    ],

    actions,
    decisions,
    events,

    objectives: [
        { id: "understand", label: "Comprendre l'origine de l'alerte", isComplete: (ctx) => ctx.has("diag_ok") },
        {
            id: "secure",
            label: "Mettre E-4 en sécurité (arrêt + consignation)",
            isComplete: (ctx) => ctx.has("stopped") && ctx.has("locked"),
        },
        { id: "decide", label: "Envoyer l'équipe au bon moment", isComplete: (ctx) => ctx.has("team_sent") },
        { id: "report", label: "Rendre compte à Marc", isComplete: (ctx) => ctx.isDone("cmd_close") },
    ],

    infoItems: [
        { id: "window", kind: "constraint", text: "Tout doit être bouclé avant 10 h 30, fin de ton astreinte." },
        { id: "risk", kind: "risk", text: "Le multiplicateur se dégrade tant que E-4 tourne." },
        { id: "who", kind: "info", text: "Marc dirige l'exploitation, Nadia suit la météo marine, Tom dirige l'équipe de maintenance." },
        { id: "limits", kind: "constraint", text: "Accès nacelle : vent ≤ 20 nœuds et vagues ≤ 1,5 m.", revealWhen: (ctx) => ctx.has("procedure_read") },
        { id: "order", kind: "constraint", text: "Ordre imposé : arrêt, puis consignation, puis accès.", revealWhen: (ctx) => ctx.has("procedure_read") },
        { id: "hse", kind: "constraint", text: "Les limites de sécurité ne se négocient pas, même sous pression.", revealWhen: (ctx) => ctx.has("hse_read") },
        { id: "forecast", kind: "info", text: "Fenêtre météo utile : environ 8 h à 10 h 30.", revealWhen: (ctx) => ctx.has("weather_known") },
        { id: "diag", kind: "info", text: "Diagnostic retenu : usure d'un roulement de l'arbre rapide.", revealWhen: (ctx) => ctx.has("diag_ok") },
    ],

    environment: (clock) => ({
        wind: Math.round(interpolate(WIND, clock)),
        wave: Math.round(interpolate(WAVES, clock) * 10) / 10,
    }),

    readouts: (ctx) => {
        const stopped = ctx.has("stopped");
        const elapsed = Math.max(0, ctx.clock - START);
        const vibration = 7.1 + elapsed * 0.025 + (ctx.has("escalated") ? 3 : 0);
        const oilTemp = stopped ? Math.max(40, 82 - Math.max(0, ctx.since("stopped")) * 0.4) : 82 + Math.floor(elapsed / 30);
        const limitKnown = ctx.has("procedure_read");
        return [
            {
                id: "wind",
                label: "Vent",
                value: `${ctx.env.wind} nœuds`,
                tone: ctx.env.wind > WIND_LIMIT ? "warn" : "good",
                hint: limitKnown ? `Limite d'accès : ${WIND_LIMIT} nœuds` : undefined,
            },
            {
                id: "wave",
                label: "Vagues (Hs)",
                value: `${fr(ctx.env.wave)} m`,
                tone: ctx.env.wave > WAVE_LIMIT ? "warn" : "good",
                hint: limitKnown ? `Limite d'accès : ${fr(WAVE_LIMIT)} m` : undefined,
            },
            {
                id: "state",
                label: "État de E-4",
                value: ctx.has("locked") ? "Consignée" : stopped ? "À l'arrêt" : "En rotation",
                tone: ctx.has("locked") ? "good" : stopped ? "neutral" : "bad",
            },
            { id: "rotor", label: "Vitesse rotor", value: stopped ? "0 tr/min" : "12,4 tr/min", tone: "neutral" },
            {
                id: "vibration",
                label: "Vibration multiplicateur",
                value: stopped ? "— (à l'arrêt)" : `${fr(Number(vibration.toFixed(1)))} mm/s`,
                tone: stopped ? "neutral" : "bad",
                hint: stopped ? undefined : "Seuil d'alarme : 7,0 mm/s",
            },
            {
                id: "oil",
                label: "Température d'huile",
                value: `${Math.round(oilTemp)} °C`,
                tone: oilTemp > 75 ? "warn" : "good",
            },
        ];
    },

    readiness: (ctx) => {
        if (!ctx.has("procedure_read")) {
            return [
                {
                    id: "unknown",
                    label: "Conditions d'intervention inconnues",
                    status: "unknown",
                    detail: "Consulte la procédure PROC-SEC-04 pour les découvrir.",
                },
            ];
        }
        return [
            { id: "diag", label: "Diagnostic posé", status: ctx.has("diag_ok") ? "ok" : "ko" },
            { id: "stop", label: "Rotor à l'arrêt", status: ctx.has("stopped") ? "ok" : "ko" },
            { id: "lock", label: "Machine consignée (LOTO)", status: ctx.has("locked") ? "ok" : "ko" },
            {
                id: "weather",
                label: "Vent ≤ 20 nœuds · vagues ≤ 1,5 m",
                status: windowOpen(ctx) ? "ok" : "ko",
                detail: `Actuellement ${ctx.env.wind} nœuds · ${fr(ctx.env.wave)} m`,
            },
            { id: "brief", label: "Équipe briefée", status: ctx.has("team_briefed") ? "ok" : "ko" },
            {
                id: "time",
                label: `Au moins ${TEAM_DURATION} min avant la fin de la fenêtre`,
                status: ctx.remaining >= TEAM_DURATION ? "ok" : "ko",
                detail: `${ctx.remaining} min restantes`,
            },
        ];
    },

    evaluateEnd: (ctx) => {
        if (ctx.indicators.safety <= 0) {
            return {
                status: "failure",
                reason: "Un incident de sécurité grave a stoppé la mission : la cellule HSE a repris la main.",
                dialogue: [say("marc", "Stop. On arrête tout, la cellule HSE prend la main. On analysera ce qui s'est passé.", "angry")],
            };
        }
        if (ctx.remaining <= 0 && !ctx.has("team_sent")) {
            const secured = ctx.has("stopped") && ctx.has("locked");
            return secured
                ? {
                      status: "partial",
                      reason: "La fenêtre météo s'est refermée avant l'envoi de l'équipe. La machine est sécurisée, l'inspection est reportée.",
                      dialogue: [say("marc", "La fenêtre est fermée. E-4 est sécurisée, c'est l'essentiel : on reprogramme l'inspection.", "neutral")],
                  }
                : {
                      status: "failure",
                      reason: "La fenêtre météo s'est refermée alors que E-4 n'était pas sécurisée et qu'aucune équipe n'a pu intervenir.",
                      dialogue: [say("marc", "Fenêtre fermée, machine toujours pas sécurisée et aucune inspection. On est dans une mauvaise situation.", "angry")],
                  };
        }
        return null;
    },

    debrief: ({ ctx, result, blockedAttempts, missed }) => {
        const evidence = ctx.doneCount(EVIDENCE_IDS);
        const analysisScore = Math.min(
            100,
            Math.round((evidence / EVIDENCE_IDS.length) * 70) + (ctx.has("diag_ok") ? (ctx.has("diag_weak") ? 15 : 30) : 0),
        );
        const procedureScore = Math.min(
            100,
            Math.max(
                0,
                (ctx.has("procedure_read") ? 30 : 0) +
                    (ctx.has("stopped") ? 20 : 0) +
                    (ctx.has("locked") ? 20 : 0) +
                    Math.max(0, 30 - blockedAttempts * 10) -
                    (ctx.has("auto_trip") ? 20 : 0),
            ),
        );
        const communicationScore = Math.min(100, Math.round(ctx.indicators.trust));
        const timeScore = Math.min(
            100,
            (ctx.has("weather_known") ? 40 : 0) + Math.round((ctx.remaining / (DEADLINE - START)) * 100 * 0.6),
        );

        const headline =
            result.status === "success"
                ? "Mission accomplie"
                : result.status === "partial"
                  ? "Mission partiellement remplie"
                  : "Mission interrompue";

        return {
            headline,
            summary: result.reason,
            skills: [
                {
                    label: "Analyse et diagnostic",
                    score: analysisScore,
                    comment: ctx.has("diag_ok")
                        ? ctx.has("diag_weak")
                            ? `Bon diagnostic, mais appuyé sur ${evidence} vérification${evidence > 1 ? "s" : ""} seulement : un diagnostic se prouve.`
                            : `Diagnostic juste et étayé par ${evidence} vérifications. C'est le cœur du métier.`
                        : "Le diagnostic n'a pas été posé : on n'agit pas sur une machine qu'on ne comprend pas.",
                },
                {
                    label: "Respect des procédures de sécurité",
                    score: procedureScore,
                    comment:
                        blockedAttempts > 0
                            ? `${blockedAttempts} tentative${blockedAttempts > 1 ? "s" : ""} bloquée${blockedAttempts > 1 ? "s" : ""} par la procédure : l'ordre arrêt, consignation, accès n'est pas négociable.`
                            : ctx.has("procedure_read")
                              ? "Tu as lu la procédure et respecté son ordre."
                              : "Tu n'as pas consulté la procédure : en situation réelle, c'est le premier réflexe.",
                },
                {
                    label: "Communication et posture",
                    score: communicationScore,
                    comment: ctx.has("pressure_resisted")
                        ? "Tu as tenu ta position face à la pression de la production."
                        : ctx.has("degraded_mode") || ctx.has("auto_trip")
                          ? "La pression de la production a pesé plus lourd que les risques techniques."
                          : "La confiance se construit avec des échanges clairs et des décisions argumentées.",
                },
                {
                    label: "Gestion du temps et de la météo",
                    score: timeScore,
                    comment: ctx.has("weather_known")
                        ? "Tu as anticipé la fenêtre météo au lieu de la subir."
                        : "Tu n'as pas interrogé la météo marine : en mer, c'est elle qui décide.",
                },
            ],
            insights: [
                "On diagnostique avec des données avant d'agir : l'urgence ne remplace pas l'analyse.",
                "Les procédures de sécurité ont un ordre précis. Arrêt, consignation, accès : l'ordre est la sécurité.",
                "En mer, la météo décide. Une fenêtre d'intervention se planifie, elle ne se force pas.",
                "Savoir dire non à la pression de la production, avec des faits, fait partie du métier.",
                ...(missed.length > 0 ? [`Tu n'as pas exploré : ${missed.join(" ; ")}.`] : []),
            ],
        };
    },
};
