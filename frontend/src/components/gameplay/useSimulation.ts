import { useCallback, useReducer } from "react";
import {
    chooseDecision,
    createInitialState,
    performAction,
    selectTool,
    showDebrief,
    startMission,
} from "./simulation";
import type { MissionDefinition, SimulationState } from "./types";

type Command =
    | { type: "start" }
    | { type: "perform"; actionId: string }
    | { type: "decide"; optionId: string }
    | { type: "tool"; toolId: string }
    | { type: "debrief" }
    | { type: "restart" };

/** Hook d'état local : toute la simulation tourne dans React, sans serveur. */
export function useSimulation(mission: MissionDefinition) {
    const [state, dispatch] = useReducer(
        (current: SimulationState, command: Command): SimulationState => {
            switch (command.type) {
                case "start":
                    return startMission(current, mission);
                case "perform":
                    return performAction(current, mission, command.actionId);
                case "decide":
                    return chooseDecision(current, mission, command.optionId);
                case "tool":
                    return selectTool(current, command.toolId);
                case "debrief":
                    return showDebrief(current);
                case "restart":
                    return createInitialState(mission);
                default:
                    return current;
            }
        },
        mission,
        createInitialState,
    );

    return {
        state,
        start: useCallback(() => dispatch({ type: "start" }), []),
        perform: useCallback((actionId: string) => dispatch({ type: "perform", actionId }), []),
        decide: useCallback((optionId: string) => dispatch({ type: "decide", optionId }), []),
        selectTool: useCallback((toolId: string) => dispatch({ type: "tool", toolId }), []),
        openDebrief: useCallback(() => dispatch({ type: "debrief" }), []),
        restart: useCallback(() => dispatch({ type: "restart" }), []),
    };
}
