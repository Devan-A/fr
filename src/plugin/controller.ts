import type {
  RoleData,
  ContextEntry,
  ParsedBoard,
  UIToControllerMessage,
} from '../types';

declare const __html__: string;

const ROLE_NAME_PATTERN = /^role-(\d+)-name$/i;
const ROLE_OBJECTIVES_PATTERN = /^role-(\d+)-objec/i;
const ROLE_PAIN_POINTS_PATTERN = /^role-(\d+)-pain-po/i;
const ROLE_TOOLS_PATTERN = /^role-(\d+)-tools$/i;

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
 * Ignores TEXT nodes (which are typically instructional labels on the board).
 */
function collectOnlyStickies(container: FrameNode | GroupNode | SectionNode): string[] {
  const texts: string[] = [];

  function walk(node: SceneNode): void {
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
 * Gets the first sticky's text from a container.
 * Used for single-value sections like Role-N-Name.
 */
function getFirstStickyText(container: FrameNode | GroupNode | SectionNode): string {
  const stickies = collectOnlyStickies(container);
  return stickies.length > 0 ? stickies[0] : '';
}

/**
 * Ensures a RoleData entry exists in the map for the given role index.
 */
function ensureRole(roleMap: Map<number, RoleData>, roleIndex: number): RoleData {
  let role = roleMap.get(roleIndex);
  if (!role) {
    role = {
      roleId: roleIndex,
      name: '',
      objectives: [],
      painPoints: [],
      tools: [],
    };
    roleMap.set(roleIndex, role);
  }
  return role;
}

/**
 * Main board parsing function. Scans the entire page for named sections
 * matching Role-N-Name, Role-N-Objectives, Role-N-Pain-Points, Role-N-Tools,
 * and contextual sections. These sections can appear anywhere on the page
 * (they don't need to be nested inside a Role-N container).
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

    const nameMatch = nodeName.match(ROLE_NAME_PATTERN);
    if (nameMatch && isContainerNode(node)) {
      const roleIndex = parseInt(nameMatch[1], 10);
      const role = ensureRole(roleMap, roleIndex);
      const stickyName = getFirstStickyText(node as FrameNode | GroupNode | SectionNode);
      if (stickyName) role.name = stickyName;
      continue;
    }

    const objMatch = nodeName.match(ROLE_OBJECTIVES_PATTERN);
    if (objMatch && isContainerNode(node)) {
      const roleIndex = parseInt(objMatch[1], 10);
      const role = ensureRole(roleMap, roleIndex);
      const stickies = collectOnlyStickies(node as FrameNode | GroupNode | SectionNode);
      role.objectives.push(...stickies);
      continue;
    }

    const painMatch = nodeName.match(ROLE_PAIN_POINTS_PATTERN);
    if (painMatch && isContainerNode(node)) {
      const roleIndex = parseInt(painMatch[1], 10);
      const role = ensureRole(roleMap, roleIndex);
      const stickies = collectOnlyStickies(node as FrameNode | GroupNode | SectionNode);
      role.painPoints.push(...stickies);
      continue;
    }

    const toolsMatch = nodeName.match(ROLE_TOOLS_PATTERN);
    if (toolsMatch && isContainerNode(node)) {
      const roleIndex = parseInt(toolsMatch[1], 10);
      const role = ensureRole(roleMap, roleIndex);
      const stickies = collectOnlyStickies(node as FrameNode | GroupNode | SectionNode);
      role.tools.push(...stickies);
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
