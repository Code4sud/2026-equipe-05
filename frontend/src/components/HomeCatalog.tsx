import React, { useState } from 'react';
import { Scenario } from '../types';
import { Play, PlusCircle, Shield, Award, Briefcase, Filter, Sparkles, Cpu } from 'lucide-react';

interface HomeCatalogProps {
  scenarios: Scenario[];
  onSelectScenario: (scenarioId: string) => void;
  onOpenStudio: () => void;
}

export const HomeCatalog: React.FC<HomeCatalogProps> = ({ scenarios, onSelectScenario, onOpenStudio }) => {
  const [selectedSecteur, setSelectedSecteur] = useState<string>("Tous");

  const secteurs = ["Tous", ...Array.from(new Set(scenarios.map(s => s.secteur)))];
  const filteredScenarios = selectedSecteur === "Tous" 
    ? scenarios 
    : scenarios.filter(s => s.secteur === selectedSecteur);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header Banner */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Architecture Neuro-Symbolique
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Gemini 2.5 Flash
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Agora Roleplay Studio
            </h1>
            <p className="text-slate-400 max-w-xl text-sm md:text-base">
              Plateforme B2B de création et de simulation de jeux de rôle métiers pilotée par IA pour l'apprentissage expérientiel et l'évaluation continue.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4">
            <button
              onClick={onOpenStudio}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-5 h-5" /> Créer un scénario
            </button>
          </div>
        </div>
      </header>

      {/* Filters & Catalog */}
      <main className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Scénarios disponibles</h2>
            <p className="text-slate-400 text-sm">Choisissez un cas métier pour lancer une simulation immersive</p>
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <div className="flex flex-wrap gap-1">
              {secteurs.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSecteur(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedSecteur === sec
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid of Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map(scenario => (
            <div
              key={scenario.scenario_id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <div className="flex justify-between items-start gap-3 mb-4">
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {scenario.secteur}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Max {scenario.tours_max} tours</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {scenario.titre_metier}
                </h3>

                <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                  {scenario.contexte}
                </p>

                {/* Gauges preview */}
                <div className="space-y-2 mb-6 bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Jauges de suivi :
                  </span>
                  {scenario.jauges.map(j => (
                    <div key={j.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 flex items-center gap-1">
                        {j.seuil_victoire !== undefined && j.seuil_victoire !== null ? (
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        {j.nom}
                      </span>
                      <span className="font-mono text-slate-400">Départ : {j.depart}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectScenario(scenario.scenario_id)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium rounded-xl transition-all shadow-md group-hover:shadow-indigo-600/20"
              >
                <Play className="w-4 h-4 fill-current" /> Lancer la simulation
              </button>
            </div>
          ))}

          {filteredScenarios.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
              Aucun scénario trouvé pour ce secteur.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
