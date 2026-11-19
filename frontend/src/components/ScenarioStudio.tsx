import React, { useRef, useState } from 'react';
import { Scenario, GaugeConfig } from '../types';
import { ScenarioCreatePayload, validateScenarioJson } from '../api';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  UserCheck,
  Target,
  FileJson,
  Upload,
  Code2,
  AlertTriangle,
  Gauge,
  HelpCircle,
  FileText
} from 'lucide-react';
import { DESK, SURFACE, SURFACE_INNER, LABEL, MUTED, BTN_DARK, TONE } from './gameplay/ui';

interface ScenarioStudioProps {
  onScenarioCreated: (scenario: Scenario) => void;
  onCancel: () => void;
  onCreateApi: (payload: ScenarioCreatePayload) => Promise<Scenario>;
}

type FieldErrors = Record<string, string>;

export const ScenarioStudio: React.FC<ScenarioStudioProps> = ({
  onScenarioCreated,
  onCancel,
  onCreateApi
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [jsonMode, setJsonMode] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonErrors, setJsonErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [validatedJson, setValidatedJson] =
    useState<ScenarioCreatePayload | null>(null);
  const [validatingJson, setValidatingJson] = useState<boolean>(false);

  const jsonFileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [titreMetier, setTitreMetier] = useState<string>('');
  const [secteur, setSecteur] = useState<string>('');
  const [contexte, setContexte] = useState<string>('');

  const [objectifEtudiant, setObjectifEtudiant] = useState<string>('');
  const [toursMax, setToursMax] = useState<number>(8);

  const [nomRole, setNomRole] = useState<string>('');
  const [ton, setTon] = useState<string>('');
  const [premierMessage, setPremierMessage] = useState<string>('');
  const [reglesEvaluation, setReglesEvaluation] = useState<string>('');

  const [jauges, setJauges] = useState<GaugeConfig[]>([
    {
      id: 'securite',
      nom: 'Sécurité & Conformité',
      depart: 70,
      seuil_echec: 0,
      seuil_victoire: null
    },
    {
      id: 'avancement',
      nom: 'Avancement Mission',
      depart: 20,
      seuil_echec: null,
      seuil_victoire: 85
    }
  ]);

  const [propositionsDepart, setPropositionsDepart] = useState<string[]>([
    "Je prends le temps d'analyser la situation avant toute action.",
    "J'applique immédiatement la procédure standard d'urgence.",
    'Je consulte l’équipe pour décider de la marche à suivre.'
  ]);

  // Affichage d'erreur sous champ
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="mt-1 text-xs font-semibold text-[#a3302a]" role="alert">
        {message}
      </p>
    );
  };

  // Validation par étape
  const validateCurrentStep = (): boolean => {
    const errors: FieldErrors = {};

    if (step === 1) {
      if (!titreMetier.trim()) {
        errors.titreMetier = 'Le titre du métier est obligatoire.';
      }
      if (!secteur.trim()) {
        errors.secteur = "Le secteur d'activité est obligatoire.";
      }
      if (!contexte.trim()) {
        errors.contexte = 'Le contexte de la situation est obligatoire.';
      }
    }

    if (step === 2) {
      if (!objectifEtudiant.trim()) {
        errors.objectifEtudiant = "L'objectif de l'étudiant est obligatoire.";
      }
      if (!Number.isInteger(toursMax) || toursMax < 3 || toursMax > 20) {
        errors.toursMax =
          'Le nombre de tours doit être un entier compris entre 3 et 20.';
      }
      if (!reglesEvaluation.trim()) {
        errors.reglesEvaluation =
          "Les règles d'évaluation sont obligatoires.";
      }
    }

    if (step === 3) {
      if (!nomRole.trim()) {
        errors.nomRole = 'Le nom du personnage est obligatoire.';
      }
      if (!ton.trim()) {
        errors.ton = "Le ton et l'attitude sont obligatoires.";
      }
      if (!premierMessage.trim()) {
        errors.premierMessage = "Le premier message est obligatoire.";
      }
    }

    if (step === 4) {
      if (jauges.length === 0) {
        errors.jauges = 'Ajoutez au moins une jauge.';
      } else {
        jauges.forEach((jauge, index) => {
          if (!jauge.nom.trim()) {
            errors.jauges = `La jauge ${index + 1} doit avoir un nom.`;
          }
          if (
            !Number.isFinite(jauge.depart) ||
            jauge.depart < 0 ||
            jauge.depart > 100
          ) {
            errors.jauges =
              `La valeur de départ de la jauge ${index + 1} doit être comprise entre 0 et 100.`;
          }
        });
      }

      if (
        propositionsDepart.length === 0 ||
        propositionsDepart.some(proposition => !proposition.trim())
      ) {
        errors.propositionsDepart =
          'Ajoutez au moins une proposition et renseignez tous les champs.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep(current => current + 1);
  };

  // Gestion des jauges
  const handleAddGauge = () => {
    const newId = `jauge_${Date.now()}`;
    setJauges(current => [
      ...current,
      {
        id: newId,
        nom: '',
        depart: 50,
        seuil_echec: 0,
        seuil_victoire: 100
      }
    ]);
    setFieldErrors({});
  };

  const handleRemoveGauge = (index: number) => {
    setJauges(current => current.filter((_, i) => i !== index));
    setFieldErrors({});
  };

  const handleGaugeChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setJauges(current => {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
    setFieldErrors({});
  };

  // Gestion des propositions
  const handleAddProposal = () => {
    setPropositionsDepart(current => [...current, '']);
    setFieldErrors({});
  };

  const handleRemoveProposal = (index: number) => {
    setPropositionsDepart(current =>
      current.filter((_, i) => i !== index)
    );
    setFieldErrors({});
  };

  const handleProposalChange = (index: number, value: string) => {
    setPropositionsDepart(current => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
    setFieldErrors({});
  };

  // Import JSON par fichier
  const handleJsonFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setJsonErrors([
        {
          field: 'Fichier',
          message: 'Sélectionnez un fichier avec l’extension .json.'
        }
      ]);
      setValidatedJson(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(String(reader.result ?? ''));
      setJsonErrors([]);
      setValidatedJson(null);
    };
    reader.onerror = () => {
      setJsonErrors([
        {
          field: 'Fichier',
          message: 'Impossible de lire ce fichier.'
        }
      ]);
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  // Validation JSON
  const handleValidateJson = async () => {
    if (!jsonText.trim()) {
      setJsonErrors([
        {
          field: 'JSON',
          message: 'Le contenu JSON est obligatoire.'
        }
      ]);
      return;
    }

    setValidatingJson(true);
    setJsonErrors([]);
    setValidatedJson(null);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        const message =
          parseError instanceof Error
            ? parseError.message
            : 'Syntaxe JSON incorrecte.';
        setJsonErrors([{ field: 'JSON', message }]);
        return;
      }

      const result = await validateScenarioJson(parsed);

      if (!result.valid || !result.scenario) {
        setJsonErrors(
          (result.errors ?? []).map(item => ({
            field: item.field || 'Scénario',
            message: item.message
          }))
        );
        return;
      }

      setValidatedJson(result.scenario);
    } catch (validationError) {
      setJsonErrors([
        {
          field: 'API',
          message:
            validationError instanceof Error
              ? validationError.message
              : 'Erreur de validation.'
        }
      ]);
    } finally {
      setValidatingJson(false);
    }
  };

  // Sauvegarde JSON validé
  const handleImportJson = async () => {
    if (!validatedJson) return;

    setLoading(true);
    setError(null);

    try {
      const created = await onCreateApi(validatedJson);
      onScenarioCreated(created);
    } catch (importError) {
      setJsonErrors([
        {
          field: 'Enregistrement',
          message:
            importError instanceof Error
              ? importError.message
              : 'Impossible d’enregistrer le scénario.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Soumission formulaire guidé
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: ScenarioCreatePayload = {
        titre_metier: titreMetier.trim(),
        secteur: secteur.trim(),
        contexte: contexte.trim(),
        objectif_etudiant: objectifEtudiant.trim(),
        tours_max: toursMax,

        persona: {
          nom_role: nomRole.trim(),
          ton: ton.trim(),
          premier_message: premierMessage.trim()
        },

        regles_evaluation: reglesEvaluation.trim(),

        jauges: jauges.map(jauge => ({
          ...jauge,
          nom: jauge.nom.trim()
        })),

        propositions_depart: propositionsDepart.map(proposition =>
          proposition.trim()
        )
      };

      const newScenario = await onCreateApi(payload);
      onScenarioCreated(newScenario);
    } catch (err: any) {
      setError(
        err.message || 'Erreur lors de la sauvegarde du scénario.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Styles communs pour formulaires papier
  const paperInputClass =
    'w-full rounded-md border border-[#c4b998] bg-[#faf6ea] px-3.5 py-2.5 text-sm text-[#2b2a26] placeholder-[#9c9580] focus:border-[#2b2a26] focus:outline-none focus:ring-1 focus:ring-[#2b2a26]';

  const stepsMeta = [
    { num: 1, label: 'Contexte & Métier' },
    { num: 2, label: 'Objectifs & Règles' },
    { num: 3, label: 'Interlocuteur IA' },
    { num: 4, label: 'Jauges & Choix' }
  ];

  return (
    <div className={`min-h-screen ${DESK} flex flex-col`}>
      {/* Top Header unifié */}
      <header className="border-b border-black/40 bg-[#14171a] px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 text-sm text-[#a39d8a] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Retour au catalogue
            </button>
            <span className="text-[#3a3f45]">|</span>
            <p className="text-base font-bold tracking-wide text-[#e8e2d0]">
              AGORA <span className="text-[#e0b252]">EXPLORER</span>
            </p>
            <span className="hidden text-xs uppercase tracking-wider text-[#a39d8a] sm:inline">
              · Studio de création
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-black/40 bg-[#1a1e22] p-1">
            <button
              type="button"
              onClick={() => {
                setJsonMode(false);
                setJsonErrors([]);
                setValidatedJson(null);
              }}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                !jsonMode
                  ? 'bg-[#e0b252] text-[#14171a] shadow'
                  : 'text-[#a39d8a] hover:text-[#e8e2d0]'
              }`}
            >
              <Layers size={13} /> Création guidée
            </button>

            <button
              type="button"
              onClick={() => {
                setJsonMode(true);
                setFieldErrors({});
              }}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                jsonMode
                  ? 'bg-[#e0b252] text-[#14171a] shadow'
                  : 'text-[#a39d8a] hover:text-[#e8e2d0]'
              }`}
            >
              <FileJson size={13} /> Importer un JSON
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl w-full flex-1 p-4 md:p-8 space-y-6">
        {/* En-tête de section */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e0b252]">
            {jsonMode ? 'IMPORT TECHNIQUE' : `ÉTAPE ${step} SUR 4`}
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-[#e8e2d0]">
            {jsonMode ? 'Import & Validation de Scénario' : 'Concevoir une simulation professionnelle'}
          </h1>
          <p className="mt-1 text-sm text-[#a39d8a] leading-relaxed">
            {jsonMode
              ? 'Chargez ou collez votre définition JSON. Le moteur contrôle automatiquement la structure avant enregistrement.'
              : 'Renseignez les détails du dossier métier. L’Agent IA compilera ces consignes pour animer la simulation.'}
          </p>
        </div>

        {/* Barre d'étapes (Mode Guidé) */}
        {!jsonMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stepsMeta.map(s => {
              const active = step === s.num;
              const completed = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`rounded-md border p-2.5 transition-all ${
                    active
                      ? 'border-[#e0b252] bg-[#1a1e22] text-[#e8e2d0]'
                      : completed
                      ? 'border-[#3a3f45] bg-[#14171a] text-[#86e19c]'
                      : 'border-black/30 bg-[#14171a] text-[#6b737d]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        active
                          ? 'bg-[#e0b252] text-[#14171a]'
                          : completed
                          ? 'bg-[#2f6b3a] text-white'
                          : 'bg-[#252a30] text-[#a39d8a]'
                      }`}
                    >
                      {completed ? '✓' : s.num}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className={`rounded-lg border p-4 text-sm ${TONE.bad.border} ${TONE.bad.bg} ${TONE.bad.text}`}>
            <p className="font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> Erreur
            </p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Field Errors Banner (Guidé) */}
        {!jsonMode && Object.keys(fieldErrors).length > 0 && (
          <div className={`rounded-lg border p-4 text-xs ${TONE.bad.border} ${TONE.bad.bg} ${TONE.bad.text}`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={15} /> Veuillez corriger les informations requises :
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {Object.values(fieldErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* MODE IMPORT JSON */}
        {jsonMode && (
          <div className={`${SURFACE} p-6 md:p-8 space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ddd2b6] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#2b2a26] flex items-center gap-2">
                  <Code2 size={18} className="text-[#2c5a7a]" /> Éditeur de scénario JSON
                </h2>
                <p className="text-xs text-[#6b6657] mt-0.5">
                  Collez directement votre structure JSON ou importez un fichier existant.
                </p>
              </div>

              <div>
                <input
                  ref={jsonFileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jsonFileRef.current?.click()}
                  className={`${BTN_DARK} flex items-center gap-1.5 text-xs`}
                >
                  <Upload size={14} /> Choisir un fichier .json
                </button>
              </div>
            </div>

            {/* Zone de code */}
            <div>
              <label className={`${LABEL} mb-2 block`}>Contenu JSON brut</label>
              <textarea
                value={jsonText}
                onChange={e => {
                  setJsonText(e.target.value);
                  setValidatedJson(null);
                  setJsonErrors([]);
                }}
                spellCheck={false}
                rows={16}
                placeholder={`{
  "titre_metier": "Technicien de maintenance éolienne",
  "secteur": "Énergies renouvelables",
  "contexte": "Intervention critique en haut de nacelle...",
  "objectif_etudiant": "Diagnostiquer l'anomalie de convertisseur.",
  "tours_max": 8,
  "persona": {
    "nom_role": "Responsable d'exploitation",
    "ton": "Exigeant et attentif à la sécurité",
    "premier_message": "Tour 3 à l'arrêt, qu'avez-vous constaté ?"
  },
  "regles_evaluation": "Sanctionner tout manquement aux protocoles d'isolement électrique.",
  "jauges": [
    { "id": "securite", "nom": "Sécurité", "depart": 70, "seuil_echec": 0 }
  ],
  "propositions_depart": [
    "J'isole immédiatement le circuit haute tension."
  ]
}`}
                className="w-full rounded-md border border-[#2d3238] bg-[#14171a] p-4 font-mono text-xs leading-5 text-[#86e19c] outline-none shadow-inner placeholder-[#4a525d] focus:border-[#e0b252]"
              />
            </div>

            {/* Erreurs de validation JSON */}
            {jsonErrors.length > 0 && (
              <div className={`rounded-md border p-4 text-xs ${TONE.bad.border} ${TONE.bad.bg} ${TONE.bad.text}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  <AlertTriangle size={15} />
                  {jsonErrors.length} problème(s) de conformité détecté(s) :
                </div>
                <ul className="space-y-1">
                  {jsonErrors.map((item, index) => (
                    <li key={`${item.field}-${index}`}>
                      <strong>{item.field || 'JSON'} :</strong> {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirmation de validation JSON */}
            {validatedJson && (
              <div className={`rounded-md border p-4 text-xs ${TONE.good.border} ${TONE.good.bg} ${TONE.good.text}`}>
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} /> JSON conforme au modèle de jeu !
                </div>
                <p className="mt-1">
                  « {validatedJson.titre_metier} » · {validatedJson.secteur} · {validatedJson.jauges.length} jauge(s). Vous pouvez désormais l'enregistrer dans Agora.
                </p>
              </div>
            )}

            {/* Boutons d'action JSON */}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleValidateJson}
                disabled={validatingJson || !jsonText.trim()}
                className="flex items-center gap-2 rounded-md bg-[#e0b252] px-4 py-2.5 text-sm font-bold text-[#14171a] shadow-[0_2px_0_rgba(0,0,0,0.25)] hover:bg-[#efc566] disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {validatingJson ? 'Vérification…' : 'Valider le format'}
              </button>

              <button
                type="button"
                onClick={handleImportJson}
                disabled={!validatedJson || loading}
                className="flex items-center gap-2 rounded-md bg-[#2f6b3a] px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] hover:bg-[#25552e] disabled:opacity-50"
              >
                <FileJson size={15} />
                {loading ? 'Enregistrement…' : 'Enregistrer le scénario'}
              </button>
            </div>
          </div>
        )}

        {/* MODE FORMULAIRE GUIDÉ */}
        {!jsonMode && (
          <div className={`${SURFACE} p-6 md:p-8 space-y-6`}>
            {/* ÉTAPE 1 : Contexte & Métier */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="border-b border-[#ddd2b6] pb-3">
                  <h2 className="text-lg font-bold text-[#2b2a26] flex items-center gap-2">
                    <Layers size={18} className="text-[#2c5a7a]" /> 1. Contexte & Métier
                  </h2>
                  <p className="text-xs text-[#6b6657] mt-0.5">
                    Définissez la profession ciblée et la situation de départ.
                  </p>
                </div>

                <div>
                  <label className={LABEL}>Titre du Métier ou Rôle *</label>
                  <input
                    type="text"
                    required
                    value={titreMetier}
                    onChange={e => {
                      setTitreMetier(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Technicien de maintenance éolienne"
                    className={paperInputClass}
                  />
                  <ErrorMessage message={fieldErrors.titreMetier} />
                </div>

                <div>
                  <label className={LABEL}>Secteur d'activité *</label>
                  <input
                    type="text"
                    required
                    value={secteur}
                    onChange={e => {
                      setSecteur(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Énergies renouvelables, Logistique, Cybersécurité..."
                    className={paperInputClass}
                  />
                  <ErrorMessage message={fieldErrors.secteur} />
                </div>

                <div>
                  <label className={LABEL}>Contexte de la situation *</label>
                  <textarea
                    rows={4}
                    required
                    value={contexte}
                    onChange={e => {
                      setContexte(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="Décrivez la situation initiale, les enjeux professionnels et les contraintes opérationnelles..."
                    className={`${paperInputClass} resize-none`}
                  />
                  <ErrorMessage message={fieldErrors.contexte} />
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : Objectifs & Règles */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="border-b border-[#ddd2b6] pb-3">
                  <h2 className="text-lg font-bold text-[#2b2a26] flex items-center gap-2">
                    <Target size={18} className="text-[#2c5a7a]" /> 2. Objectifs & Contraintes pédagogiques
                  </h2>
                  <p className="text-xs text-[#6b6657] mt-0.5">
                    Fixez les conditions de succès et les règles d'évaluation pour l'IA.
                  </p>
                </div>

                <div>
                  <label className={LABEL}>Objectif assigné à l'étudiant *</label>
                  <textarea
                    rows={3}
                    required
                    value={objectifEtudiant}
                    onChange={e => {
                      setObjectifEtudiant(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Sécuriser la nacelle, isoler la tension et rétablir le convertisseur sans dépasser le délai."
                    className={`${paperInputClass} resize-none`}
                  />
                  <ErrorMessage message={fieldErrors.objectifEtudiant} />
                </div>

                <div>
                  <label className={LABEL}>Nombre maximal de tours de discussion *</label>
                  <input
                    type="number"
                    required
                    min={3}
                    max={20}
                    step={1}
                    value={toursMax}
                    onChange={e => {
                      setToursMax(Number(e.target.value));
                      setFieldErrors({});
                    }}
                    className={paperInputClass}
                  />
                  <p className="mt-1 text-[11px] text-[#8b8570]">Entre 3 et 20 tours (recommandé : 8).</p>
                  <ErrorMessage message={fieldErrors.toursMax} />
                </div>

                <div>
                  <label className={LABEL}>Règles d'évaluation pour l'IA *</label>
                  <textarea
                    rows={3}
                    required
                    value={reglesEvaluation}
                    onChange={e => {
                      setReglesEvaluation(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="Quels comportements l'IA doit-elle sanctionner (imprudence, manque de courtoisie) ou récompenser ?"
                    className={`${paperInputClass} resize-none`}
                  />
                  <ErrorMessage message={fieldErrors.reglesEvaluation} />
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Profil & Premier Message IA */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="border-b border-[#ddd2b6] pb-3">
                  <h2 className="text-lg font-bold text-[#2b2a26] flex items-center gap-2">
                    <UserCheck size={18} className="text-[#2c5a7a]" /> 3. Interlocuteur Métier (Avatar IA)
                  </h2>
                  <p className="text-xs text-[#6b6657] mt-0.5">
                    Définissez qui dialogue avec l'étudiant et comment s'ouvre la simulation.
                  </p>
                </div>

                <div>
                  <label className={LABEL}>Nom et Rôle de l'interlocuteur *</label>
                  <input
                    type="text"
                    required
                    value={nomRole}
                    onChange={e => {
                      setNomRole(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Pierre - Chef d'exploitation de parc"
                    className={paperInputClass}
                  />
                  <ErrorMessage message={fieldErrors.nomRole} />
                </div>

                <div>
                  <label className={LABEL}>Ton et attitude du personnage *</label>
                  <input
                    type="text"
                    required
                    value={ton}
                    onChange={e => {
                      setTon(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Direct, sous pression mais professionnel et attentif à la sécurité"
                    className={paperInputClass}
                  />
                  <ErrorMessage message={fieldErrors.ton} />
                </div>

                <div>
                  <label className={LABEL}>Premier message prononcé par l'interlocuteur *</label>
                  <textarea
                    rows={3}
                    required
                    value={premierMessage}
                    onChange={e => {
                      setPremierMessage(e.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="ex: Bonjour ! La turbine numéro 4 est en défaut critique de convertisseur. Que préconisez-vous ?"
                    className={`${paperInputClass} resize-none`}
                  />
                  <ErrorMessage message={fieldErrors.premierMessage} />
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : Jauges & Choix de départ */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-[#ddd2b6] pb-3">
                  <h2 className="text-lg font-bold text-[#2b2a26] flex items-center gap-2">
                    <Gauge size={18} className="text-[#2c5a7a]" /> 4. Jauges d'évaluation & Réponses de départ
                  </h2>
                  <p className="text-xs text-[#6b6657] mt-0.5">
                    Configurez les indicateurs de suivi et les premières suggestions de répliques.
                  </p>
                </div>

                {/* Section Jauges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={LABEL}>Jauges de suivi ({jauges.length}) *</label>
                    <button
                      type="button"
                      onClick={handleAddGauge}
                      className="flex items-center gap-1 text-xs font-bold text-[#2c5a7a] hover:text-black"
                    >
                      <Plus size={14} /> Ajouter une jauge
                    </button>
                  </div>

                  {jauges.map((jauge, idx) => (
                    <div key={jauge.id || idx} className={`${SURFACE_INNER} p-3.5 space-y-2`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase text-[#6b6657]">Jauge {idx + 1}</span>
                        {jauges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGauge(idx)}
                            className="text-[#a3302a] hover:text-black text-xs flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Supprimer
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-[#6b6657] block mb-1">Nom affiché</label>
                          <input
                            type="text"
                            required
                            value={jauge.nom}
                            onChange={e => handleGaugeChange(idx, 'nom', e.target.value)}
                            placeholder="ex: Sécurité & Procédure"
                            className={paperInputClass}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-[#6b6657] block mb-1">Valeur de départ (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={jauge.depart}
                            onChange={e => handleGaugeChange(idx, 'depart', Number(e.target.value))}
                            className={paperInputClass}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-[#6b6657] block mb-1">Seuil d'échec (optionnel)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={jauge.seuil_echec ?? ''}
                            onChange={e =>
                              handleGaugeChange(
                                idx,
                                'seuil_echec',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            placeholder="ex: 0"
                            className={paperInputClass}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-[#6b6657] block mb-1">Seuil de victoire (optionnel)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={jauge.seuil_victoire ?? ''}
                            onChange={e =>
                              handleGaugeChange(
                                idx,
                                'seuil_victoire',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            placeholder="ex: 85"
                            className={paperInputClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <ErrorMessage message={fieldErrors.jauges} />
                </div>

                {/* Section Propositions de départ */}
                <div className="space-y-3 pt-3 border-t border-[#ddd2b6]">
                  <div className="flex items-center justify-between">
                    <label className={LABEL}>Suggestions de réponses au 1er tour ({propositionsDepart.length}) *</label>
                    <button
                      type="button"
                      onClick={handleAddProposal}
                      className="flex items-center gap-1 text-xs font-bold text-[#2c5a7a] hover:text-black"
                    >
                      <Plus size={14} /> Ajouter une suggestion
                    </button>
                  </div>

                  {propositionsDepart.map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2b2a26] text-xs font-bold text-[#f3ecd9]">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={prop}
                        onChange={e => handleProposalChange(idx, e.target.value)}
                        placeholder="ex: Je coupe le disjoncteur général..."
                        className={`flex-1 ${paperInputClass}`}
                      />
                      {propositionsDepart.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProposal(idx)}
                          className="p-1.5 text-[#a3302a] hover:text-black"
                          title="Supprimer la suggestion"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <ErrorMessage message={fieldErrors.propositionsDepart} />
                </div>
              </div>
            )}

            {/* Barre de navigation du formulaire guidé */}
            <div className="flex items-center justify-between border-t border-[#ddd2b6] pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFieldErrors({});
                    setError(null);
                    setStep(current => current - 1);
                  }}
                  className={`${BTN_DARK} flex items-center gap-1.5`}
                >
                  <ArrowLeft size={15} /> Précédent
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex items-center gap-2 rounded-md bg-[#e0b252] px-5 py-2.5 text-sm font-bold text-[#14171a] shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors hover:bg-[#efc566]"
                >
                  Suivant <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-md bg-[#2f6b3a] px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors hover:bg-[#25552e] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {loading ? 'Compilation & Enregistrement…' : 'Générer et Enregistrer'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer épuré */}
      <footer className="border-t border-black/40 bg-[#14171a] px-4 py-4 text-center text-xs text-[#6b737d]">
        Agora Explorer · Système d'apprentissage expérientiel B2B
      </footer>
    </div>
  );
};
