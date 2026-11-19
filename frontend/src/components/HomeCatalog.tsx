import React, { useState } from 'react';
import { Scenario } from '../types';
import { Play, Plus, Clock, Gauge, Shield, Award, Filter, Sparkles, FolderOpen, UserCheck } from 'lucide-react';
import { DESK, SURFACE, SURFACE_INNER, LABEL, MUTED, BTN_DARK, TONE } from './gameplay/ui';

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
    <div className={`min-h-screen ${DESK} flex flex-col`}>
      {/* Top Header unifié */}
      <header className="border-b border-black/40 bg-[#14171a] px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex items-baseline gap-3">
            <p className="text-base font-bold tracking-wide text-[#e8e2d0]">
              AGORA <span className="text-[#e0b252]">EXPLORER</span>
            </p>
            <span className="hidden text-xs uppercase tracking-wider text-[#a39d8a] sm:inline">
              · Catalogue des simulations
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStudio}
              type="button"
              className="flex items-center gap-2 rounded-md bg-[#e0b252] px-3.5 py-2 text-sm font-bold text-[#14171a] shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors hover:bg-[#efc566] active:translate-y-0.5"
            >
              <Plus size={16} /> Nouveau scénario
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] w-full flex-1 px-4 py-8 md:px-8 space-y-8">
        {/* En-tête épuré du catalogue */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/30 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e0b252]">
              DOSSIERS DE FORMATION
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-[#e8e2d0]">
              Missions & Mises en situation métier
            </h1>
            <p className="mt-1 text-sm text-[#a39d8a] max-w-2xl leading-relaxed">
              Sélectionnez un dossier pour lancer une simulation immersive en dialogue interactif avec l'avatar IA.
            </p>
          </div>

          <div className="text-xs text-[#a39d8a] font-mono">
            {filteredScenarios.length} {filteredScenarios.length > 1 ? "dossiers disponibles" : "dossier disponible"}
          </div>
        </div>

        {/* Filtres par secteur */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a39d8a] mr-2">
            <Filter size={13} /> Secteur :
          </span>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-black/40 bg-[#1a1e22] p-1">
            {secteurs.map(sec => {
              const active = selectedSecteur === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSecteur(sec)}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#e0b252] text-[#14171a] shadow"
                      : "text-[#a39d8a] hover:bg-[#252a30] hover:text-[#e8e2d0]"
                  }`}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grille des dossiers de scénarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map(scenario => (
            <article
              key={scenario.scenario_id}
              className={`${SURFACE} flex flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,0.35)]`}
            >
              <div>
                {/* En-tête du dossier */}
                <div className="flex items-center justify-between gap-2 border-b border-[#ddd2b6] pb-3 mb-4">
                  <span className="rounded border border-[#c4b998] bg-[#faf6ea] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6b6657]">
                    {scenario.secteur}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono font-medium text-[#6b6657]">
                    <Clock size={13} /> Max {scenario.tours_max} tours
                  </span>
                </div>

                {/* Titre et interlocuteur */}
                <h2 className="text-xl font-bold leading-tight text-[#2b2a26] mb-2">
                  {scenario.titre_metier}
                </h2>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b6657] mb-3">
                  <UserCheck size={14} className="text-[#2c5a7a]" />
                  <span>Interlocuteur : <strong>{scenario.persona.nom_role}</strong> ({scenario.persona.ton})</span>
                </div>

                {/* Résumé du contexte */}
                <p className="text-sm leading-relaxed text-[#4a463b] line-clamp-3 mb-5">
                  {scenario.contexte}
                </p>

                {/* Mini fiche des jauges */}
                <div className={`${SURFACE_INNER} p-3 mb-5 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <p className={`${LABEL} text-[10px]`}>Critères de mission</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {scenario.jauges.map(j => (
                      <div key={j.id} className="flex items-center justify-between gap-1 text-[11px] text-[#4a463b]">
                        <span className="truncate flex items-center gap-1" title={j.nom}>
                          <Gauge size={12} className="shrink-0 text-[#6b6657]" />
                          {j.nom}
                        </span>
                        <span className="font-mono font-bold text-[#2b2a26] shrink-0">{j.depart}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton d'action prise de poste */}
              <button
                type="button"
                onClick={() => onSelectScenario(scenario.scenario_id)}
                className={`${BTN_DARK} flex w-full items-center justify-center gap-2 !py-2.5 text-sm !bg-[#2b2a26] hover:!bg-black`}
              >
                <Play size={15} /> Ouvrir le dossier & jouer
              </button>
            </article>
          ))}

          {/* Aucun résultat */}
          {filteredScenarios.length === 0 && (
            <div className={`col-span-full ${SURFACE} p-12 text-center space-y-3`}>
              <FolderOpen size={36} className="mx-auto text-[#8b8570]" />
              <p className="text-base font-bold text-[#2b2a26]">Aucun dossier trouvé pour ce filtre</p>
              <p className="text-sm text-[#6b6657]">Essayez de sélectionner « Tous » pour afficher l'ensemble des scénarios.</p>
              <button
                type="button"
                onClick={() => setSelectedSecteur("Tous")}
                className={`${BTN_DARK} mt-2 text-xs`}
              >
                Réinitialiser le filtre
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer épuré */}
      <footer className="border-t border-black/40 bg-[#14171a] px-4 py-4 text-center text-xs text-[#6b737d]">
        Agora Explorer · Système d'apprentissage expérientiel B2B
      </footer>
    </div>
  );
};
