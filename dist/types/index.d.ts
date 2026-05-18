/**
 * A single role parsed from the board, aggregating data across
 * Role-N-Name, Role-N-Objectives, Role-N-Pain-Points, and Role-N-Tools sections.
 */
export interface RoleData {
    roleId: number;
    name: string;
    objectives: string[];
    painPoints: string[];
    tools: string[];
}
/**
 * A single entry from one of the contextual sections
 * (General Description, External Complexifiers, Starting Hypotheses, Data Details).
 */
export interface ContextEntry {
    category: string;
    text: string;
}
/**
 * Complete parsed board data sent from controller to UI.
 */
export interface ParsedBoard {
    projectId: string;
    roles: RoleData[];
    context: ContextEntry[];
    lastParsed: string;
}
/**
 * Summary statistics shown in the UI after parsing.
 */
export interface ParseSummary {
    roleCount: number;
    totalObjectives: number;
    totalPainPoints: number;
    totalTools: number;
    contextCounts: Record<string, number>;
}
/** Messages sent from UI iframe to plugin controller. */
export type UIToControllerMessage = {
    type: 'PARSE_BOARD';
} | {
    type: 'CLOSE_PLUGIN';
};
/** Messages sent from plugin controller to UI iframe. */
export type ControllerToUIMessage = {
    type: 'BOARD_DATA';
    payload: ParsedBoard;
} | {
    type: 'PARSE_ERROR';
    message: string;
} | {
    type: 'PARSING_STARTED';
};
//# sourceMappingURL=index.d.ts.map