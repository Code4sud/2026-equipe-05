import React, { useState } from 'react';
import { Scenario, GaugeConfig } from '../types';
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Sparkles, Layers, UserCheck, Target } from 'lucide-react';

interface ScenarioStudioProps {
  onScenarioCreated: (scenario: Scenario) => void;
  onCancel: () => void;
  onCreateApi: (payload: Omit<Scenario, 'scenario_id'>) => Promise<Scenario>;
}

export const ScenarioStudio: React.FC<ScenarioStudioProps> = ({ onScenarioCreated, onCancel, onCreateApi }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [titreMetier, setTitreMetier] = useState<string>("");
  const [secteur, setSecteur] = useState<string>("");
  const [contexte, setContexte] = useState<string>("");
  
  const [objectifEtudiant, setObjectifEtudiant] = useState<string>("");
  const [toursMax, setToursMax] = useState<number>(8);
  
  const [nomRole, setNomRole] = useState<string>("");
  const [ton, setTon] = useState<string>("");
  const [premierMessage, setPremierMessage] = useState<string>("");
  const [reglesEvaluation, setReglesEvaluation] = useState<string>("");
  
  const [jauges, setJauges] = useState<GaugeConfig[]>([
    { id: "securite", nom: "Sécurité & Conformité", depart: 70, seuil_echec: 0, seuil_victoire: null },
    { id: "avancement", nom: "Avancement Mission", depart: 20, seuil_echec: null, seuil_victoire: 85 }
  ]);
  
  const [propositionsDepart, setPropositionsDepart] = useState<string[]>([
    "Je prends le temps d'analyser la situation avant toute action.",
    "J'applique immédiatement la procédure standard d'urgence.",
    "Je consulte l'équipe pour décider de la marche à suivre."
  ]);

  // Gauge helpers
  const handleAddGauge = () => {
    const newId = `jauge_${Date.now()}`;
    setJauges([...jauges, { id: newId, nom: "Nouvelle jauge", depart: 50, seuil_echec: 0, seuil_victoire: 100 }]);
  };

  const handleRemoveGauge = (index: number) => {
    setJauges(jauges.filter((_, i) => i !== index));
  };

  const handleGaugeChange = (index: number, field: string, value: any) => {
    const updated = [...jauges];
    updated[index] = { ...updated[index], [field]: value };
    setJauges(updated);
  };

  // Proposal helpers
  const handleAddProposal = () => {
    setPropositionsDepart([...propositionsDepart, ""]);
  };

  const handleRemoveProposal = (index: number) => {
    setPropositionsDepart(propositionsDepart.filter((_, i) => i !== index));
  };

  const handleProposalChange = (index: number, val: string) => {
    const updated = [...propositionsDepart];
    updated[index] = val;
    setPropositionsDepart(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Omit<Scenario, 'scenario_id'> = {
        titre_metier: titreMetier || "Expert Métier",
        secteur: secteur || "Général",
        contexte: contexte || "Contexte de simulation professionnelle.",
        objectif_etudiant: objectifEtudiant || "Atteindre les objectifs assignés.",
        tours_max: Number(toursMax) || 8,
        persona: {
          nom_role: nomRole || "Interlocuteur Métier",
          ton: ton || "Professionnel et direct",
          premier_message: premierMessage || "Bonjour, commençons la simulation. Quelle est votre première initiative ?"
        },
        regles_evaluation: reglesEvaluation || "Évaluer la pertinence métier, la rigueur et le respect des consignes.",
        jauges: jauges.length > 0 ? jauges : [{ id: "j1", nom: "Performance", depart: 50, seuil_echec: 0, seuil_victoire: 100 }],
        propositions_depart: propositionsDepart.filter(p => p.trim() !== "")
      };

      const newScenario = await onCreateApi(payload);
      onScenarioCreated(newScenario);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde du scénario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Studio Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Studio de Création de Scénario
              </h1>
              <p className="text-xs text-slate-400">Générez un cas B2B sur-mesure pour votre simulation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
            Étape {step} sur 4
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 flex">
          <div className="bg-indigo-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {/* Step Content */}
        <div className="p-8 flex-1 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Layers className="w-5 h-5" /> 1. Métier & Contexte général
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Titre du Métier / Rôle</label>
                <input
                  type="text"
                  value={titreMetier}
                  onChange={e => setTitreMetier(e.target.value)}
                  placeholder="ex: Technicien de maintenance éolienne"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Secteur d'activité</label>
                <input
                  type="text"
                  value={secteur}
                  onChange={e => setSecteur(e.target.value)}
                  placeholder="ex: Énergies renouvelables, Supply Chain..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contexte de la situation</label>
                <textarea
                  rows={4}
                  value={contexte}
                  onChange={e => setContexte(e.target.value)}
                  placeholder="Décrivez la situation initiale, les enjeux et les contraintes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Target className="w-5 h-5" /> 2. Objectif & Contraintes pédagogiques
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Objectif assigné à l'étudiant</label>
                <textarea
                  rows={3}
                  value={objectifEtudiant}
                  onChange={e => setObjectifEtudiant(e.target.value)}
                  placeholder="Que doit réussir l'étudiant à l'issue de la simulation ?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nombre maximum de tours</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={toursMax}
                  onChange={e => setToursMax(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Règles d'évaluation de l'IA (Consignes omniscientes)</label>
                <textarea
                  rows={3}
                  value={reglesEvaluation}
                  onChange={e => setReglesEvaluation(e.target.value)}
                  placeholder="Quels comportements l'IA doit-elle sanctionner ou récompenser ?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <UserCheck className="w-5 h-5" /> 3. Profil & Premier Message de l'IA
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nom du rôle / Personnage incarné par l'IA</label>
                <input
                  type="text"
                  value={nomRole}
                  onChange={e => setNomRole(e.target.value)}
                  placeholder="ex: Marc - Chef d'équipe sécurité"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ton et attitude de l'IA</label>
                <input
                  type="text"
                  value={ton}
                  onChange={e => setTon(e.target.value)}
                  placeholder="ex: Rigoureux, pressé, intransigeant sur les procédures"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Premier message de l'avatar (Ouverture du jeu)</label>
                <textarea
                  rows={3}
                  value={premierMessage}
                  onChange={e => setPremierMessage(e.target.value)}
                  placeholder="Que dit l'avatar au tout premier tour pour interpeller l'étudiant ?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Sparkles className="w-5 h-5" /> 4. Jauges dynamiques & Propositions de départ
              </div>

              {/* Jauges Builder */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Jauges de suivi</label>
                  <button onClick={handleAddGauge} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    <Plus className="w-4 h-4" /> Ajouter une jauge
                  </button>
                </div>

                <div className="space-y-3">
                  {jauges.map((j, idx) => (
                    <div key={j.id || idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                      <input
                        type="text"
                        value={j.nom}
                        onChange={e => handleGaugeChange(idx, 'nom', e.target.value)}
                        placeholder="Nom de la jauge"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      />
                      <div className="w-24">
                        <span className="text-[10px] text-slate-400 block mb-1">Départ (0-100)</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={j.depart}
                          onChange={e => handleGaugeChange(idx, 'depart', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white text-xs"
                        />
                      </div>
                      <button onClick={() => handleRemoveGauge(idx)} className="text-rose-400 hover:text-rose-300 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Propositions Builder */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Propositions de départ (Boutons cliquables)</label>
                  <button onClick={handleAddProposal} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    <Plus className="w-4 h-4" /> Ajouter une proposition
                  </button>
                </div>

                <div className="space-y-3">
                  {propositionsDepart.map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={prop}
                        onChange={e => handleProposalChange(idx, e.target.value)}
                        placeholder="ex: Je vérifie les équipements..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button onClick={() => handleRemoveProposal(idx)} className="text-rose-400 hover:text-rose-300 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-950 border-t border-slate-800 p-6 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-800 text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> {loading ? "Création..." : "Générer et Enregistrer"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
