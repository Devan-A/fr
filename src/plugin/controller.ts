import type {
  RoleData,
  ContextEntry,
  ParsedBoard,
  UIToControllerMessage,
} from '../types';

declare const __html__: string;

const ROLE_PATTERN = /^role-(\d+)$/i;
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

/**
 * Checks if a node is a container type that can hold children.
 */
function isContainerNode(node: SceneNode): node is FrameNode | GroupNode | SectionNode {
  return node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
}

/**
 * Extracts text content from a node. Handles TEXT, STICKY, and SHAPE_WITH_TEXT directly.
 * For containers, recursively searches for the first text-bearing child.
 */
function extractText(node: SceneNode): string {
  if (node.type === 'TEXT') {
    return node.characters.trim();
  }
  if (node.type === 'STICKY') {
    return node.text.characters.trim();
  }
  if (node.type === 'SHAPE_WITH_TEXT') {
    return node.text.characters.trim();
  }
  if (isContainerNode(node) && 'children' in node) {
    for (const child of node.children) {
      const text = extractText(child);
      if (text) return text;
    }
  }
  return '';
}

/**
 * Collects all sticky/text content from direct and nested children of a container,
 * skipping children that match known named patterns (sub-sections like Role-N-Name, etc.).
 */
function collectStickyTexts(
  container: FrameNode | GroupNode | SectionNode,
  excludePatterns: RegExp[] = []
): string[] {
  const texts: string[] = [];

  function shouldExclude(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return excludePatterns.some(p => p.test(normalized));
  }

  function walk(node: SceneNode): void {
    if (shouldExclude(node.name)) return;

    if (node.type === 'STICKY') {
      const text = node.text.characters.trim();
      if (text) texts.push(text);
      return;
    }
    if (node.type === 'TEXT') {
      const text = node.characters.trim();
      if (text) texts.push(text);
      return;
    }
    if (node.type === 'SHAPE_WITH_TEXT') {
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
 * Finds a direct or nested child with a name matching the given pattern.
 */
function findChildByPattern(
  parent: FrameNode | GroupNode | SectionNode,
  pattern: RegExp
): SceneNode | null {
  for (const child of parent.children) {
    if (pattern.test(child.name.toLowerCase().trim())) {
      return child;
    }
  }
  for (const child of parent.children) {
    if (isContainerNode(child)) {
      const found = findChildByPattern(child, pattern);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds all children whose names match a pattern, searching recursively.
 */
function findAllChildrenByPattern(
  parent: FrameNode | GroupNode | SectionNode,
  pattern: RegExp
): SceneNode[] {
  const results: SceneNode[] = [];

  function search(node: SceneNode): void {
    if (pattern.test(node.name.toLowerCase().trim())) {
      results.push(node);
    }
    if (isContainerNode(node) && 'children' in node) {
      for (const child of node.children) {
        search(child);
      }
    }
  }

  for (const child of parent.children) {
    search(child);
  }
  return results;
}

/**
 * Extracts the stickies nested inside a named sub-section of a role container.
 * For example, finds "Role-1-Pain-Points" inside the "Role-1" container
 * and returns all sticky texts within it.
 */
function extractSubSectionStickies(
  roleContainer: FrameNode | GroupNode | SectionNode,
  pattern: RegExp
): string[] {
  const subSection = findChildByPattern(roleContainer, pattern);
  if (!subSection) return [];

  if (isContainerNode(subSection)) {
    return collectStickyTexts(subSection);
  }

  const text = extractText(subSection);
  return text ? [text] : [];
}

/**
 * Parses a single role from its container node, extracting name, objectives,
 * pain points, and tools from named sub-sections.
 */
function parseRole(roleNode: SceneNode, roleIndex: number): RoleData {
  const role: RoleData = {
    roleId: roleIndex,
    name: '',
    objectives: [],
    painPoints: [],
    tools: [],
  };

  if (!isContainerNode(roleNode)) return role;

  const container = roleNode as FrameNode | GroupNode | SectionNode;

  const namePattern = new RegExp(`^role-${roleIndex}-name$`, 'i');
  const nameNode = findChildByPattern(container, namePattern);
  if (nameNode) {
    role.name = extractText(nameNode);
  }

  const objPattern = new RegExp(`^role-${roleIndex}-objec`, 'i');
  role.objectives = extractSubSectionStickies(container, objPattern);

  const painPattern = new RegExp(`^role-${roleIndex}-pain-po`, 'i');
  role.painPoints = extractSubSectionStickies(container, painPattern);

  const toolsPattern = new RegExp(`^role-${roleIndex}-tools$`, 'i');
  role.tools = extractSubSectionStickies(container, toolsPattern);

  return role;
}

/**
 * Parses all contextual sections (General Description, External Complexifiers,
 * Starting Hypotheses, Data Details) from the board.
 */
function parseContextSections(allNodes: SceneNode[]): ContextEntry[] {
  const entries: ContextEntry[] = [];

  for (const node of allNodes) {
    const nodeName = node.name.toLowerCase().trim();
    for (const [category, pattern] of Object.entries(CONTEXT_SECTIONS)) {
      if (pattern.test(nodeName) && isContainerNode(node)) {
        const texts = collectStickyTexts(node as FrameNode | GroupNode | SectionNode);
        for (const text of texts) {
          entries.push({ category, text });
        }
      }
    }
  }

  return entries;
}

/**
 * Main board parsing function. Traverses the entire current page,
 * identifies Role-N containers and context sections, and builds a ParsedBoard.
 */
function parseBoard(): ParsedBoard {
  const allNodes = figma.currentPage.findAll(() => true);
  const roleMap = new Map<number, RoleData>();

  for (const node of allNodes) {
    const match = node.name.toLowerCase().trim().match(ROLE_PATTERN);
    if (match) {
      const roleIndex = parseInt(match[1], 10);
      if (!roleMap.has(roleIndex)) {
        const role = parseRole(node, roleIndex);
        roleMap.set(roleIndex, role);
      }
    }
  }

  const roles = Array.from(roleMap.values()).sort((a, b) => a.roleId - b.roleId);
  const context = parseContextSections(allNodes);

  const projectId = figma.root.name || figma.currentPage.name || 'project';

  return {
    projectId,
    roles,
    context,
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
