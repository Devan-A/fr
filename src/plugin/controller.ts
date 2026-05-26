import type {
  RoleData,
  ContextEntry,
  ParsedBoard,
  UIToControllerMessage,
} from '../types';

declare const __html__: string;

/** Matches "Role 1", "Role 2", "role 3", "Role-1", etc. */
const ROLE_CONTAINER_PATTERN = /^role[- ]?(\d+)$/i;

/** Child section names inside each Role container. */
const NAME_PATTERN = /^name$/i;
const OBJECTIVE_PATTERN = /^objective/i;
const PAIN_POINTS_PATTERN = /^pain[- ]?points?/i;
const TOOLS_PATTERN = /^tools?$/i;
const NOTES_PATTERN = /^notes?$/i;

const CONTEXT_SECTIONS: Record<string, RegExp> = {
  'General Description': /^general[- ]?description$/i,
  'External Complexifiers': /^external[- ]?complexifiers$/i,
  'Starting Hypotheses': /^starting[- ]?hypotheses$/i,
  'Data Details': /^data[- ]?details$/i,
};

function isContainerNode(node: SceneNode): node is FrameNode | GroupNode | SectionNode {
  return node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
}

/**
 * Collects text only from STICKY nodes inside a container, recursively.
 * Ignores TEXT nodes (instructional labels) and any children matching
 * the skip patterns.
 */
function collectOnlyStickies(
  container: FrameNode | GroupNode | SectionNode,
  skipPatterns: RegExp[] = []
): string[] {
  const texts: string[] = [];

  function shouldSkip(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return skipPatterns.some(p => p.test(normalized));
  }

  function walk(node: SceneNode): void {
    if (shouldSkip(node.name)) return;

    if (node.type === 'STICKY') {
      const text = node.text.characters.trim();
      if (text) texts.push(text);
      return;
    }
    if (isContainerNode(node) && 'children' in node) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const child of container.children) {
    walk(child);
  }
  return texts;
}

/**
 * Finds a direct child container whose name matches the given pattern.
 */
function findChildSection(
  parent: FrameNode | GroupNode | SectionNode,
  pattern: RegExp
): (FrameNode | GroupNode | SectionNode) | null {
  for (const child of parent.children) {
    if (isContainerNode(child) && pattern.test(child.name.toLowerCase().trim())) {
      return child;
    }
  }
  for (const child of parent.children) {
    if (isContainerNode(child)) {
      const found = findChildSection(child, pattern);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Parses a single Role container, extracting Name, Objective, Pain Points,
 * and Tools from its child sections. Notes sections are skipped.
 */
function parseRoleContainer(
  container: FrameNode | GroupNode | SectionNode,
  roleIndex: number
): RoleData {
  const role: RoleData = {
    roleId: roleIndex,
    name: '',
    objectives: [],
    painPoints: [],
    tools: [],
  };

  const nameSection = findChildSection(container, NAME_PATTERN);
  if (nameSection) {
    const stickies = collectOnlyStickies(nameSection);
    if (stickies.length > 0) role.name = stickies[0];
  }

  const objSection = findChildSection(container, OBJECTIVE_PATTERN);
  if (objSection) {
    role.objectives = collectOnlyStickies(objSection);
  }

  const painSection = findChildSection(container, PAIN_POINTS_PATTERN);
  if (painSection) {
    role.painPoints = collectOnlyStickies(painSection);
  }

  const toolsSection = findChildSection(container, TOOLS_PATTERN);
  if (toolsSection) {
    role.tools = collectOnlyStickies(toolsSection);
  }

  return role;
}

/**
 * Main board parsing function. Scans the entire page for:
 * - "Role N" container frames, then parses their child sections (Name,
 *   Objective, Pain Points, Tools). Notes sections are ignored.
 * - Contextual sections (General Description, External Complexifiers,
 *   Starting Hypotheses, Data Details).
 *
 * Only STICKY node text is captured; TEXT nodes are ignored since they
 * contain instructional labels, not participant data.
 */
function parseBoard(): ParsedBoard {
  const allNodes = figma.currentPage.findAll(() => true);
  const roleMap = new Map<number, RoleData>();
  const contextEntries: ContextEntry[] = [];

  for (const node of allNodes) {
    const nodeName = node.name.toLowerCase().trim();

    const roleMatch = nodeName.match(ROLE_CONTAINER_PATTERN);
    if (roleMatch && isContainerNode(node)) {
      const roleIndex = parseInt(roleMatch[1], 10);
      if (!roleMap.has(roleIndex)) {
        const role = parseRoleContainer(node as FrameNode | GroupNode | SectionNode, roleIndex);
        roleMap.set(roleIndex, role);
      }
      continue;
    }

    for (const [category, pattern] of Object.entries(CONTEXT_SECTIONS)) {
      if (pattern.test(nodeName) && isContainerNode(node)) {
        const stickies = collectOnlyStickies(node as FrameNode | GroupNode | SectionNode);
        for (const text of stickies) {
          contextEntries.push({ category, text });
        }
        break;
      }
    }
  }

  const roles = Array.from(roleMap.values()).sort((a, b) => a.roleId - b.roleId);

  return {
    roles,
    context: contextEntries,
    lastParsed: new Date().toISOString(),
  };
}

figma.showUI(__html__, {
  width: 400,
  height: 620,
  themeColors: true,
});

figma.ui.onmessage = (msg: UIToControllerMessage) => {
  try {
    switch (msg.type) {
      case 'PARSE_BOARD': {
        figma.ui.postMessage({ type: 'PARSING_STARTED' });
        const parsedBoard = parseBoard();
        figma.ui.postMessage({ type: 'BOARD_DATA', payload: parsedBoard });
        break;
      }
      case 'CLOSE_PLUGIN': {
        figma.closePlugin();
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Plugin error:', error);
    figma.ui.postMessage({ type: 'PARSE_ERROR', message });
  }
};
