/**
 * MISSION DE TEST (pré-alpha) — alerte sur une éolienne offshore.
 *
 * Données locales et fictives, destinées uniquement à tester le gameplay sans
 * backend. Les personnages, répliques et conséquences ci-dessous sont écrits à
 * la main : ce ne sont PAS des réponses d'un agent IA.
 *
 * Structure : une suite de « rencontres ». Chaque rencontre = quelqu'un vient
 * te parler, tu choisis ta réponse, le personnage réagit et les conséquences
 * s'appliquent. Les rencontres suivantes s'adaptent à ce que tu as fait
 * (drapeaux `has("…")`).
 *
 * FUTURE INTEGRATION IA :
 * remplacer `characters`, les `opening` et les `outcome` par les personnages et
 * les réactions générés par l'agent (voir `Responder` dans `types.ts`).
 *
 * FUTURE INTEGRATION BACKEND :
 * charger la mission (contexte, jauges, objectifs) depuis le scénario de la
 * session plutôt que depuis ce fichier.
 */

import type {
    DialogueInput,
    Encounter,
    EndResult,
    Expression,
    GameContext,
    GuideStep,
    MissionDefinition,
    ObjectiveDefinition,
    Outcome,
} from "../types";

const say = (speakerId: string, text: string, expression: Expression = "neutral"): DialogueInput => ({ speakerId, text, expression });
const r = (text: string, expression: Expression = "neutral") => ({ text, expression });

/** Drapeaux qui traduisent une erreur ou un risque pris (utilisés pour le compte rendu et le bilan). */
const MISTAKES = ["rushed", "diag_wrong", "degraded", "skipped_lock", "unsafe_window", "team_sent_unsafe"];
const madeMistake = (ctx: GameContext) => MISTAKES.some((flag) => ctx.has(flag));
const teamReady = (ctx: GameContext) => ctx.has("secured") && ctx.has("weather_ok") && !ctx.has("unsafe_window");

/* ------------------------------------------------------------------ */
/* Objectifs                                                           */
/* ------------------------------------------------------------------ */

const objectives: ObjectiveDefinition[] = [
    { id: "understand", label: "Comprendre l'origine de l'alerte", isComplete: (ctx) => ctx.has("diag_ok") },
    { id: "secure", label: "Mettre l'éolienne en sécurité", isComplete: (ctx) => ctx.has("secured") },
    { id: "team", label: "Envoyer l'équipe au bon moment", isComplete: (ctx) => ctx.has("team_sent_ok") },
    { id: "report", label: "Rendre compte honnêtement", isComplete: (ctx) => ctx.has("reported_honest") },
];

/* ------------------------------------------------------------------ */
/* Rencontres                                                          */
/* ------------------------------------------------------------------ */

const encounters: Encounter[] = [
    /* 1 — Marc : l'alerte ------------------------------------------------ */
    {
        id: "alert",
        characterId: "marc",
        time: "06:40",
        title: "Marc t'appelle : alarme sur E-4",
        objectiveId: "understand",
        opening: [
            say("marc", "Salut ! Une alarme de vibrations vient de se déclencher sur l'éolienne E-4, en pleine mer. Le vent souffle à 25 nœuds, ça secoue.", "concerned"),
            say("marc", "Tu es de permanence : c'est toi qui décides. Tu fais quoi en premier ?", "neutral"),
        ],
        replies: [
            {
                id: "data",
                label: "Je regarde d'abord les mesures de la machine.",
                outcome: {
                    reaction: [r("Bon réflexe : on ne décide jamais à l'aveugle. Regarde bien les chiffres.", "happy")],
                    consequence: { tone: "good", title: "Tu as vérifié avant d'agir", text: "Tu as lu les mesures avant de décider : tu as de quoi comprendre l'alerte." },
                    deltas: { trust: 10 },
                    setFlags: ["checked_data"],
                },
            },
            {
                id: "rush",
                label: "J'envoie l'équipe en mer, tout de suite !",
                outcome: {
                    reaction: [r("Stop ! Avec ce vent, c'est dangereux, et on ne sait même pas ce qui cloche !", "angry")],
                    consequence: { tone: "bad", title: "Danger évité de justesse", text: "Envoyer des gens en mer sans comprendre l'alerte, avec 25 nœuds de vent, met leur sécurité en jeu." },
                    deltas: { safety: -15, trust: -10 },
                    setFlags: ["rushed"],
                },
            },
            {
                id: "stop",
                label: "J'arrête la machine par précaution.",
                outcome: {
                    reaction: [r("Prudent, ça évite le pire. Mais arrêter ne suffit pas : il faut aussi comprendre ce qui cloche.", "concerned")],
                    consequence: { tone: "neutral", title: "Machine arrêtée", text: "Plus sûr, mais le parc produit moins d'électricité." },
                    deltas: { safety: 10, efficiency: -10 },
                    setFlags: ["stopped"],
                },
            },
        ],
    },

    /* 2 — Tom : le diagnostic ------------------------------------------- */
    {
        id: "diagnosis",
        characterId: "tom",
        time: "06:55",
        title: "Tom, chef d'équipe, te demande ton diagnostic",
        objectiveId: "understand",
        opening: (ctx) => [
            ctx.has("checked_data")
                ? say("tom", "J'ai vu que tu as regardé les mesures. Elles disent : la vibration monte à chaque tour de rotor, et l'huile est à 92 °C, c'est beaucoup trop chaud.", "neutral")
                : say("tom", "Je n'ai pas encore les mesures complètes, mais la vibration est forte et l'huile semble très chaude : 92 °C.", "concerned"),
            say("tom", "Dehors il fait 8 °C. À ton avis, c'est quoi le problème ?", "thinking"),
        ],
        replies: [
            {
                id: "bearing",
                label: "Un roulement du multiplicateur est usé.",
                outcome: (ctx): Outcome => ({
                    reaction: [r("Oui, ça colle : vibration plus huile chaude, c'est la signature d'un roulement qui s'use.", "happy")],
                    consequence: ctx.has("checked_data")
                        ? { tone: "good", title: "Bon diagnostic, bien appuyé", text: "Tu t'es appuyé sur des mesures : c'est ce qui rend ton diagnostic fiable." }
                        : { tone: "good", title: "Bon diagnostic", text: "Tu as vu juste, mais sans avoir regardé les mesures. La prochaine fois, vérifie d'abord." },
                    deltas: ctx.has("checked_data") ? { trust: 10, safety: 5 } : { trust: 5 },
                    setFlags: ["diag_ok"],
                }),
            },
            {
                id: "sensor",
                label: "C'est une fausse alarme : le capteur est cassé.",
                outcome: {
                    reaction: [r("Hmm, pas sûr. L'huile à 92 °C, ce n'est pas un capteur qui se trompe…", "concerned")],
                    consequence: { tone: "bad", title: "Piste fausse", text: "Une alarme qu'on ignore peut cacher une vraie panne. L'huile chaude ne ment pas." },
                    deltas: { safety: -15 },
                    setFlags: ["diag_wrong"],
                },
            },
            {
                id: "frost",
                label: "C'est du givre sur les pales.",
                outcome: {
                    reaction: [r("Il fait 8 °C : pas de givre. Et le givre ne chauffe pas l'huile.", "surprised")],
                    consequence: { tone: "bad", title: "Piste fausse", text: "Le givre ne peut pas expliquer une huile à 92 °C." },
                    deltas: { safety: -10 },
                    setFlags: ["diag_wrong"],
                },
            },
        ],
    },

    /* 2b — Tom : seconde chance (adaptatif) ------------------------------ */
    {
        id: "second_opinion",
        characterId: "tom",
        time: "07:05",
        title: "Tom reprend le diagnostic avec toi",
        objectiveId: "understand",
        when: (ctx) => ctx.has("diag_wrong") && !ctx.has("diag_ok"),
        opening: [
            say("tom", "On reprend ensemble, sans stress. Tu as : une vibration qui monte à chaque tour, une huile trop chaude, et 8 °C dehors.", "neutral"),
            say("tom", "Qu'est-ce que ça te dit ?", "thinking"),
        ],
        replies: [
            {
                id: "bearing",
                label: "Un roulement du multiplicateur s'use.",
                outcome: {
                    reaction: [r("Voilà. Tu as corrigé le tir, c'est ça qui compte.", "happy")],
                    consequence: { tone: "good", title: "Tu as corrigé ton erreur", text: "Revenir sur un premier avis, preuves à l'appui, fait partie du métier." },
                    deltas: { trust: 5 },
                    setFlags: ["diag_ok", "diag_late"],
                },
            },
            {
                id: "help",
                label: "Je ne sais pas, explique-moi.",
                outcome: {
                    reaction: [r("Merci de le dire franchement. C'est un roulement : il frotte, il vibre, il chauffe l'huile. Je te montre les relevés.", "happy")],
                    consequence: { tone: "good", title: "Demander de l'aide n'est pas une faiblesse", text: "Mieux vaut dire « je ne sais pas » que décider au hasard." },
                    deltas: { trust: 5 },
                    setFlags: ["diag_ok", "asked_help"],
                },
            },
        ],
    },

    /* 3 — Claire : la pression ------------------------------------------ */
    {
        id: "pressure",
        characterId: "claire",
        time: "07:20",
        title: "La direction veut relancer la machine",
        objectiveId: "secure",
        opening: (ctx) => [
            ctx.has("stopped")
                ? say("claire", "Bonjour, ici Claire Duval, de la direction de la production. J'ai vu qu'E-4 est à l'arrêt. Chaque heure d'arrêt nous coûte cher.", "neutral")
                : say("claire", "Bonjour, ici Claire Duval, de la direction de la production. J'ai vu l'alarme sur E-4. Chaque heure d'arrêt nous coûte cher.", "neutral"),
            say("claire", "Garde-la en service à 50 % ce matin, d'accord ?", "happy"),
        ],
        replies: [
            {
                id: "refuse",
                label: "Non : sans réparation, c'est dangereux. Voici pourquoi : l'huile est à 92 °C.",
                outcome: {
                    reaction: [r("Hmm. Si tu as des chiffres, j'écoute. On attendra, alors.", "concerned")],
                    consequence: { tone: "good", title: "Tu as tenu bon, avec des faits", text: "Dire non à la pression, en donnant des arguments précis, protège les équipes." },
                    deltas: { trust: 10, efficiency: -10, safety: 5 },
                    setFlags: ["pressure_resisted"],
                },
            },
            {
                id: "accept",
                label: "D'accord, on la relance à 50 %.",
                outcome: {
                    reaction: [r("Parfait, merci ! C'est ce qu'on voulait entendre.", "happy")],
                    consequence: { tone: "bad", title: "Tu as cédé à la pression", text: "La production repart, mais la machine abîmée tourne à nouveau. Le risque monte." },
                    deltas: { safety: -35, efficiency: 20 },
                    setFlags: ["degraded"],
                },
            },
            {
                id: "delay",
                label: "Laissez-moi 30 minutes pour vérifier, je vous rappelle.",
                outcome: {
                    reaction: [r("D'accord, mais ne tarde pas trop.", "neutral")],
                    consequence: { tone: "neutral", title: "Tu as gagné du temps", text: "Tu n'as ni cédé ni refusé : tu t'es donné le temps de décider." },
                    deltas: { efficiency: -5, trust: 5 },
                    setFlags: ["pressure_delayed"],
                },
            },
        ],
    },

    /* 3b — Tom : conséquence d'avoir cédé (adaptatif) ------------------- */
    {
        id: "trip",
        characterId: "tom",
        time: "07:35",
        title: "Alarme niveau 2 : E-4 s'est coupée seule",
        objectiveId: "secure",
        when: (ctx) => ctx.has("degraded"),
        opening: [
            say("tom", "Alarme niveau 2 ! E-4 vient de se couper toute seule : le multiplicateur a trop chauffé. Ça va coûter cher à réparer.", "angry"),
            say("tom", "Qu'est-ce qu'on fait maintenant ?", "concerned"),
        ],
        replies: [
            {
                id: "own",
                label: "J'assume : on met la machine en sécurité et je préviens la direction.",
                outcome: {
                    reaction: [r("Bien. Tout le monde peut se tromper, ce qui compte c'est la suite.", "neutral")],
                    consequence: { tone: "good", title: "Tu assumes", text: "Reconnaître une erreur et agir tout de suite limite les dégâts." },
                    deltas: { safety: 10, trust: 5 },
                    setFlags: ["owned_mistake"],
                },
            },
            {
                id: "blame",
                label: "Ce n'est pas ma faute : c'est la direction qui a insisté.",
                outcome: {
                    reaction: [r("Peut-être. Mais c'est toi qui avais la main…", "angry")],
                    consequence: { tone: "bad", title: "Tu rejettes la faute", text: "Accuser les autres fait perdre la confiance de l'équipe." },
                    deltas: { trust: -15 },
                    setFlags: ["blamed_others"],
                },
            },
        ],
    },

    /* 4 — Tom : la procédure de sécurité --------------------------------- */
    {
        id: "procedure",
        characterId: "tom",
        time: "07:50",
        title: "Tom demande la procédure de sécurité",
        objectiveId: "secure",
        opening: (ctx) => [
            ctx.has("stopped") || ctx.has("degraded")
                ? say("tom", "E-4 est à l'arrêt. Avant que mon équipe monte dessus, rappelle-moi la procédure de sécurité.", "neutral")
                : say("tom", "E-4 tourne encore ! Avant que mon équipe monte dessus, rappelle-moi la procédure de sécurité.", "concerned"),
            say("tom", "Dans quel ordre on fait les choses ?", "thinking"),
        ],
        replies: [
            {
                id: "right",
                label: "1. On arrête la machine. 2. On la consigne (cadenas). 3. Seulement après, on monte.",
                outcome: {
                    reaction: [r("Exactement. Arrêt, consignation, accès : l'ordre, c'est la sécurité.", "happy")],
                    consequence: { tone: "good", title: "Procédure respectée", text: "Machine arrêtée puis verrouillée : personne ne peut la redémarrer pendant l'intervention." },
                    deltas: { safety: 15, trust: 5 },
                    setFlags: ["secured"],
                },
            },
            {
                id: "onsite",
                label: "On monte d'abord, et on coupe une fois sur place.",
                outcome: {
                    reaction: [r("Non ! Personne ne monte sur une machine qui peut redémarrer !", "angry")],
                    consequence: { tone: "bad", title: "Danger de mort évité", text: "Monter avant l'arrêt et le verrouillage : c'est l'accident le plus grave du métier." },
                    deltas: { safety: -30 },
                    setFlags: ["skipped_lock"],
                },
            },
            {
                id: "nolock",
                label: "On consigne sans arrêter la machine, ça va plus vite.",
                outcome: {
                    reaction: [r("On ne peut pas verrouiller une machine qui tourne. Ça ne marche pas comme ça.", "surprised")],
                    consequence: { tone: "bad", title: "Étapes dans le désordre", text: "On arrête d'abord, on verrouille ensuite. Sauter une étape met tout le monde en danger." },
                    deltas: { safety: -25 },
                    setFlags: ["skipped_lock"],
                },
            },
        ],
    },

    /* 4b — Tom : on reprend la procédure (adaptatif) --------------------- */
    {
        id: "procedure_retry",
        characterId: "tom",
        time: "08:00",
        title: "Tom te repose la question, calmement",
        objectiveId: "secure",
        when: (ctx) => ctx.has("skipped_lock") && !ctx.has("secured"),
        opening: [
            say("tom", "Je ne monte pas tant que ce n'est pas clair. Reprenons, doucement.", "neutral"),
            say("tom", "Dans quel ordre ?", "thinking"),
        ],
        replies: [
            {
                id: "right",
                label: "Arrêt, puis consignation, puis accès.",
                outcome: {
                    reaction: [r("Voilà. On peut avancer.", "happy")],
                    consequence: { tone: "good", title: "Cette fois, c'est bon", text: "La machine est arrêtée et verrouillée avant toute intervention." },
                    deltas: { safety: 5 },
                    setFlags: ["secured"],
                },
            },
            {
                id: "help",
                label: "Je ne m'en souviens plus, tu peux me le rappeler ?",
                outcome: {
                    reaction: [r("Arrêt, consignation, accès. Retiens-le : ça sauve des vies.", "neutral")],
                    consequence: { tone: "warn", title: "Mieux vaut demander que deviner", text: "Tu as demandé : bien. Mais ces règles doivent devenir un réflexe." },
                    deltas: { trust: -5 },
                    setFlags: ["secured", "asked_help"],
                },
            },
        ],
    },

    /* 5 — Nadia : la météo ----------------------------------------------- */
    {
        id: "weather",
        characterId: "nadia",
        time: "08:10",
        title: "Nadia, météo marine, donne sa prévision",
        objectiveId: "team",
        opening: (ctx) => [
            ctx.has("rushed")
                ? say("nadia", "J'ai entendu qu'on voulait envoyer une équipe en mer tout de suite. Surtout pas !", "concerned")
                : say("nadia", "Bonjour, ici la météo marine, pour E-4.", "neutral"),
            say("nadia", "Le vent est à 25 nœuds, mais il va tomber à 18 vers 8 h 30. Vagues : 1,2 mètre. La limite pour monter, c'est 20 nœuds. Fenêtre favorable : de 8 h 30 à 10 h 30.", "neutral"),
            say("nadia", "Tu décides quoi ?", "thinking"),
        ],
        replies: [
            {
                id: "wait",
                label: "On attend 8 h 30 et on part dans la fenêtre météo.",
                outcome: {
                    reaction: [r("Bonne décision : à 8 h 30, tu auras des conditions sûres.", "happy")],
                    consequence: { tone: "good", title: "Tu as respecté la météo", text: "En mer, c'est la météo qui décide. Tu as planifié l'intervention au bon moment." },
                    deltas: { safety: 10, trust: 5 },
                    setFlags: ["weather_ok"],
                },
            },
            {
                id: "now",
                label: "On part maintenant, on gagne du temps.",
                outcome: {
                    reaction: [r("25 nœuds, c'est au-dessus de la limite. Je te le déconseille vraiment.", "concerned")],
                    consequence: { tone: "bad", title: "Hors des limites de sécurité", text: "Monter avec plus de 20 nœuds de vent est interdit : trop dangereux." },
                    deltas: { safety: -25 },
                    setFlags: ["unsafe_window"],
                },
            },
            {
                id: "cancel",
                label: "On annule tout, c'est trop risqué.",
                outcome: {
                    reaction: [r("C'est prudent. Dommage quand même : la fenêtre de 8 h 30 était bonne.", "neutral")],
                    consequence: { tone: "warn", title: "Prudent, mais trop", text: "Tu évites tout risque, mais tu gâches une vraie fenêtre d'intervention." },
                    deltas: { efficiency: -20, trust: -5 },
                    setFlags: ["weather_ok", "over_cautious"],
                },
            },
        ],
    },

    /* 6 — Tom : feu vert ? ----------------------------------------------- */
    {
        id: "team",
        characterId: "tom",
        time: "08:35",
        title: "Tom : l'équipe est prête, on y va ?",
        objectiveId: "team",
        opening: (ctx) => [
            teamReady(ctx)
                ? say("tom", "Tout est bon de mon côté : la machine est verrouillée, la fenêtre météo est ouverte, l'équipe est prête.", "happy")
                : say("tom", "L'équipe est prête à partir. Mais je ne suis pas sûr qu'on ait tout bien vérifié…", "concerned"),
            say("tom", "Je les envoie ?", "thinking"),
        ],
        replies: [
            {
                id: "go",
                label: "Oui, go : toutes les conditions sont réunies.",
                outcome: (ctx): Outcome =>
                    teamReady(ctx)
                        ? {
                              reaction: [r("Parfait, on décolle ! Je te tiens au courant.", "happy")],
                              consequence: { tone: "good", title: "Intervention lancée au bon moment", text: "Machine verrouillée, météo favorable, équipe prête : tout est réuni." },
                              deltas: { safety: 10, trust: 10, efficiency: 10 },
                              setFlags: ["team_sent_ok"],
                          }
                        : {
                              reaction: [r("Attends… il manque quelque chose, non ? Trop tard, ils sont partis.", "surprised")],
                              consequence: { tone: "bad", title: "Équipe envoyée sans toutes les conditions", text: "Machine non verrouillée ou météo hors limites : l'équipe est en danger." },
                              deltas: { safety: -30, trust: -10 },
                              setFlags: ["team_sent_unsafe"],
                          },
            },
            {
                id: "wait",
                label: "Pas encore : je veux vérifier qu'il ne manque rien.",
                outcome: (ctx): Outcome =>
                    teamReady(ctx)
                        ? {
                              reaction: [r("D'accord… tout était vert, mais soit. On part avec un peu de retard.", "neutral")],
                              consequence: { tone: "warn", title: "Vérification inutile", text: "Tout était réuni : tu as perdu 20 minutes. Mieux vaut trop de prudence que pas assez, mais le temps compte." },
                              deltas: { efficiency: -10 },
                              setFlags: ["team_sent_ok"],
                          }
                        : {
                              reaction: [r("Tu as raison. On règle le point qui manque, et on part.", "happy")],
                              consequence: { tone: "good", title: "Tu as repéré ce qui manquait", text: "Une dernière vérification a évité d'envoyer l'équipe trop tôt." },
                              deltas: { safety: 10, trust: 10 },
                              setFlags: ["team_sent_ok", "fixed_late"],
                          },
            },
            {
                id: "hurry",
                label: "Envoie-les vite, ne perdons pas de temps !",
                outcome: (ctx): Outcome =>
                    teamReady(ctx)
                        ? {
                              reaction: [r("Ok, ils partent ! Tu es pressé, mais ça passe.", "neutral")],
                              consequence: { tone: "warn", title: "Ça passe, de justesse", text: "Cette fois tout était réuni. Sans vérifier, tu as eu de la chance." },
                              deltas: { efficiency: 5, trust: -5 },
                              setFlags: ["team_sent_ok"],
                          }
                        : {
                              reaction: [r("Quoi ? Sans que tout soit prêt ? Ils sont déjà partis !", "angry")],
                              consequence: { tone: "bad", title: "Équipe envoyée trop vite", text: "Tu as envoyé l'équipe alors qu'une condition de sécurité manquait." },
                              deltas: { safety: -35, trust: -15 },
                              setFlags: ["team_sent_unsafe"],
                          },
            },
        ],
    },

    /* 7 — Marc : le compte rendu ------------------------------------------ */
    {
        id: "report",
        characterId: "marc",
        time: "10:00",
        title: "Marc te demande ton compte rendu",
        objectiveId: "report",
        opening: (ctx) => [
            say("marc", "L'équipe est de retour. Merci pour ta permanence.", madeMistake(ctx) ? "concerned" : "happy"),
            say("marc", "Raconte-moi : comment ça s'est passé ?", "thinking"),
        ],
        replies: [
            {
                id: "full",
                label: "Je te fais un compte rendu complet : ce que j'ai vu, décidé, et ce qui n'a pas marché.",
                outcome: (ctx): Outcome => ({
                    reaction: [r(madeMistake(ctx) ? "Merci d'être franc sur tes erreurs. C'est comme ça qu'on progresse." : "Très clair, très complet. Bravo.", "happy")],
                    consequence: { tone: "good", title: "Compte rendu honnête", text: "Dire ce qui s'est vraiment passé, même ce qui a raté, construit la confiance et la sécurité de demain." },
                    deltas: { trust: 15 },
                    setFlags: ["reported_honest"],
                }),
            },
            {
                id: "nothing",
                label: "Tout s'est bien passé, rien à signaler.",
                outcome: (ctx): Outcome =>
                    madeMistake(ctx)
                        ? {
                              reaction: [r("Vraiment ? Les journaux disent pourtant autre chose…", "angry")],
                              consequence: { tone: "bad", title: "Tu as caché des erreurs", text: "Cacher un problème empêche l'équipe d'en tirer des leçons. Ça se voit toujours." },
                              deltas: { trust: -25 },
                              setFlags: ["concealed"],
                          }
                        : {
                              reaction: [r("Et c'est la vérité, je l'ai vu dans les journaux. Bien joué.", "happy")],
                              consequence: { tone: "good", title: "Tout s'est bien passé", text: "Ton résumé correspond aux faits : tu as été clair et honnête." },
                              deltas: { trust: 5 },
                              setFlags: ["reported_honest"],
                          },
            },
            {
                id: "short",
                label: "Je fais le point vite fait, sans détails.",
                outcome: {
                    reaction: [r("Hmm, j'aurais aimé plus de détails pour que l'équipe suivante comprenne.", "neutral")],
                    consequence: { tone: "warn", title: "Compte rendu trop court", text: "Sans détails, personne ne peut apprendre de ce qui s'est passé." },
                },
            },
        ],
    },
];

/* ------------------------------------------------------------------ */
/* Visite guidée vocale (textes écrits à la main, pas un agent IA)      */
/* ------------------------------------------------------------------ */

/** Ton « commandant » : phrases courtes, ordres à l'impératif, une idée par étape. */
const guide: GuideStep[] = [
    {
        id: "welcome",
        targetId: null,
        title: "Garde à vous, recrue !",
        speech:
            "Garde à vous, recrue ! Ici le commandement. Je te présente ton écran en quelques secondes. Une zone à la fois : celle dont je parle reste nette, tout le reste est flou. Quand tu as compris, appuie sur Entrée. En avant !",
    },
    {
        id: "mission",
        targetId: "mission",
        title: "Ta mission",
        where: "Colonne de droite",
        speech:
            "Première zone : ta mission ! Tu es de permanence sur un parc d'éoliennes en mer. Une alarme vient de se déclencher sur l'éolienne E-4. Tu as quatre objectifs : comprendre l'alerte, mettre la machine en sécurité, envoyer l'équipe au bon moment, et rendre compte honnêtement. Chaque objectif atteint se coche tout seul !",
    },
    {
        id: "status",
        targetId: "status",
        title: "Tes jauges",
        where: "Bandeau en haut de l'écran",
        speech:
            "Deuxième zone : tes jauges ! Sécurité, confiance, efficacité. Chaque réponse les fait monter ou descendre, et tu vois tout de suite de combien. Attention : si la sécurité tombe à zéro, la mission s'arrête !",
    },
    {
        id: "call",
        targetId: "call",
        title: "Qui te parle",
        where: "En haut de la conversation",
        speech:
            "Troisième zone : qui te parle ! Tu vois la personne qui vient te voir, son métier, l'heure, et l'objectif concerné. Son visage change selon son humeur : rassuré, inquiet, ou furieux !",
    },
    {
        id: "chat",
        targetId: "chat",
        title: "La conversation",
        where: "Au milieu de l'écran",
        speech:
            "Quatrième zone : la conversation ! Tout ce qui se dit s'écrit ici, comme dans une messagerie. Les conséquences de tes choix aussi, sur des cartes colorées avec le détail des jauges. Lis-les : c'est comme ça que tu apprends le métier !",
    },
    {
        id: "replies",
        targetId: "replies",
        title: "Tes réponses",
        where: "En bas de la conversation",
        speech:
            "Cinquième zone : tes réponses ! Tu choisis ce que tu dis. Clique, ou tape le chiffre au clavier. Chaque réponse a ses conséquences, et le personnage réagit à ce que tu dis. Réfléchis, puis réponds !",
    },
    {
        id: "final",
        targetId: "all",
        title: "À toi de jouer !",
        speech:
            "C'est tout, recrue ! Quelqu'un arrive, tu écoutes, tu réponds, tu assumes les conséquences. Si tu veux me réécouter, clique sur « Revoir le guide » en haut. Bonne chance !",
    },
];

/* ------------------------------------------------------------------ */
/* Fin de mission et bilan                                             */
/* ------------------------------------------------------------------ */

const evaluateEnd = (ctx: GameContext, cause: "completed" | "critical"): EndResult => {
    if (cause === "critical") {
        return { status: "failure", reason: "La jauge de sécurité est tombée à zéro : dans la vraie vie, la mission serait arrêtée et une enquête ouverte." };
    }
    const done = objectives.filter((objective) => objective.isComplete(ctx)).length;
    if (done === objectives.length && ctx.indicators.safety >= 50) {
        return { status: "success", reason: "Tous les objectifs sont atteints et la sécurité a été préservée." };
    }
    if (done >= 2) {
        return { status: "partial", reason: `${done} objectifs sur ${objectives.length} atteints : il reste des points à améliorer.` };
    }
    return { status: "failure", reason: "Trop peu d'objectifs atteints : la situation n'a pas été maîtrisée." };
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const mission: MissionDefinition = {
    id: "offshore-gearbox-alert",
    title: "Alerte sur l'éolienne E-4",
    role: "Responsable de permanence d'un parc éolien en mer",
    sector: "Énergie · éolien en mer",
    location: "Centre de contrôle du parc éolien",
    summary:
        "Une alarme se déclenche sur une éolienne en mer. Les gens viennent te parler, tu réponds et tu décides : chaque réponse a des conséquences.",

    briefing: {
        eyebrow: "PRISE DE POSTE · 06:40",
        headline: "Tu prends la permanence du parc éolien en mer",
        narrative: [
            "Il est 6 h 40. Une alarme vient de se déclencher sur l'éolienne E-4, à plusieurs kilomètres des côtes.",
            "Pendant la matinée, plusieurs personnes vont venir te parler : ton responsable, le chef d'équipe, la météo, la direction. À chaque fois, tu choisis ta réponse, et tu en assumes les conséquences.",
        ],
        roleSummary:
            "Un responsable de permanence ne répare pas : il écoute, comprend, protège les personnes et décide au bon moment, souvent sous la pression de la production et de la météo.",
        objectives: objectives.map((objective) => objective.label),
    },

    guide,

    indicators: [
        { id: "safety", label: "Sécurité", meaning: "Les personnes et la machine sont-elles protégées ? À zéro, la mission s'arrête.", icon: "shield", initial: 70, critical: true },
        { id: "trust", label: "Confiance", meaning: "L'équipe et ton responsable te font-ils confiance ?", icon: "handshake", initial: 50 },
        { id: "efficiency", label: "Efficacité", meaning: "Le parc produit-il et le temps est-il bien utilisé ?", icon: "gauge", initial: 50 },
    ],

    characters: [
        { id: "marc", name: "Marc", role: "Responsable d'exploitation", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
        { id: "tom", name: "Tom", role: "Chef d'équipe maintenance", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
        { id: "nadia", name: "Nadia", role: "Prévisionniste météo marine", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
        { id: "claire", name: "Claire Duval", role: "Direction de la production", avatarUrl: null, expression: "neutral", dialogue: "", status: "idle" },
    ],

    encounters,
    objectives,
    evaluateEnd,

    debrief: ({ result, ctx }) => {
        const analysis = ctx.has("diag_ok") ? (ctx.has("diag_wrong") ? 55 : ctx.has("checked_data") ? 100 : 80) : 20;
        const safety = clampScore((ctx.has("secured") ? 100 : 30) - (ctx.has("skipped_lock") ? 40 : 0) - (ctx.has("team_sent_unsafe") ? 30 : 0));
        const pressure = clampScore(
            (ctx.has("pressure_resisted") ? 100 : ctx.has("pressure_delayed") ? 70 : 20) + (ctx.has("owned_mistake") ? 10 : 0) - (ctx.has("blamed_others") ? 20 : 0),
        );
        const weather = ctx.has("weather_ok") ? (ctx.has("over_cautious") ? 65 : 100) : ctx.has("unsafe_window") ? 10 : 30;
        const communication = clampScore((ctx.has("reported_honest") ? 100 : ctx.has("concealed") ? 5 : 50) - (ctx.has("blamed_others") ? 20 : 0));

        const headlines = {
            success: "Mission réussie !",
            partial: "Mission en demi-teinte",
            failure: "Mission échouée",
        } as const;

        return {
            headline: headlines[result.status],
            summary: result.reason,
            skills: [
                {
                    label: "Analyse et diagnostic",
                    score: analysis,
                    comment: ctx.has("checked_data") ? "Tu as regardé les mesures avant de conclure : c'est la base." : "Pense à vérifier les données avant de te prononcer.",
                },
                {
                    label: "Respect des règles de sécurité",
                    score: safety,
                    comment: ctx.has("skipped_lock") ? "Tu as sauté une étape de la procédure : l'ordre arrêt, consignation, accès ne se négocie pas." : "Tu as respecté l'ordre arrêt, consignation, accès.",
                },
                {
                    label: "Tenir face à la pression",
                    score: pressure,
                    comment: ctx.has("pressure_resisted")
                        ? "Tu as dit non à la pression avec des arguments précis."
                        : ctx.has("degraded")
                          ? "Tu as cédé à la pression de la production et la machine en a payé le prix."
                          : "Tu as gagné du temps plutôt que de trancher : parfois utile, rarement suffisant.",
                },
                {
                    label: "Météo et timing",
                    score: weather,
                    comment: ctx.has("unsafe_window") ? "Tu as voulu agir hors des limites de vent : en mer, la météo décide." : "Tu as tenu compte de la fenêtre météo.",
                },
                {
                    label: "Communication honnête",
                    score: communication,
                    comment: ctx.has("concealed") ? "Tu as caché des erreurs à ton responsable : ça casse la confiance." : ctx.has("reported_honest") ? "Ton compte rendu était clair et franc." : "Ton compte rendu manquait de détails.",
                },
            ],
            insights: [
                "On comprend avant d'agir : l'urgence ne remplace pas l'analyse.",
                "Les procédures de sécurité ont un ordre précis. Arrêt, consignation, accès : l'ordre est la sécurité.",
                "En mer, la météo décide. Une intervention se planifie dans la bonne fenêtre, elle ne se force pas.",
                "Savoir dire non à la pression, avec des faits, fait partie du métier.",
                "Reconnaître ses erreurs et le dire honnêtement permet à toute l'équipe de progresser.",
            ],
        };
    },
};

export const offshoreTurbineMission = mission;
