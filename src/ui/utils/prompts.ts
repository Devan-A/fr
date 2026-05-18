/**
 * Master prompt displayed on Sheet 1 — written as direct instructions for Copilot,
 * not for a human reader.
 */
export const MASTER_PROMPT = `# Instructions

You are receiving a workbook with 6 sheets. This sheet (Sheet 1) contains your instructions. Sheets 2–6 each contain a prompt and, where applicable, structured data extracted from a FigJam board.

You will also receive a separate document containing a Business Problem Statement from a previous workshop.

## Workflow

Execute the prompts in order, Sheet 2 through Sheet 6:

1. **Sheet 2 — Prompt 1: Role Profiles**
   Use the prompt and the dataset provided on that sheet to generate psychological role profiles.

2. **Sheet 3 — Prompt 2: Human Problem Statement**
   Use the prompt and the dataset provided on that sheet to synthesize a unified human problem statement.

3. **Sheet 4 — Prompt 3: Business Problem Update**
   Use the prompt on that sheet. The original business problem statement comes from the separately uploaded document. Incorporate your outputs from Prompts 1 and 2 as the "new information."

4. **Sheet 5 — Prompt 4: Solution Hypotheses**
   Use the prompt on that sheet. Draw on your outputs from Prompts 1–3 as the required inputs.

5. **Sheet 6 — Prompt 5: Solution Ideas & DVF Evaluation**
   Use the prompt on that sheet. Draw on your outputs from all prior prompts as the required inputs.

## Data Notes

- Sheets 2 and 3 include the full board dataset directly below their prompts, structured as Tabs 1–5.
- Sheets 4–6 do not include board data; they rely on your prior outputs within this conversation.
- The Business Problem Statement is in the separately uploaded document, not in this workbook.

## Final Output

After completing all 5 prompts, compile all 5 generated outputs into separate documents and package them into a single ZIP file for download. Name each file:
- 01-Role-Profiles.md
- 02-Human-Problem-Statement.md
- 03-Updated-Business-Problem.md
- 04-Solution-Hypotheses.md
- 05-Solution-Ideas-DVF.md
`;

export const PROMPT_1_ROLE_PROFILES = `#Role
You are an expert organizational psychologist and behavioral researcher. Your task is to generate comprehensive role profiles using the structured dataset I will provide. The dataset contains multiple tabs merged into one structure, with the following relationships:
- **Tab 1:** project_id, role_id, role_name
- **Tab 2:** project_id, role_id, role_objective
- **Tab 3:** project_id, role_id, pain_point
- **Tab 4:** project_id, role_id, tools
- **Tab 5:** project_id, additional_context, category
  (Categories: General Description, External Complexifiers, Starting Hypotheses, Data Details)

### Your Goal
Using all rows that share the same \`role_id\`, create a single, unified psychological role profile for each role. The number of profiles you generate should equal the number of unique role_ids.

### Inputs You Will Receive
I will provide the full dataset in a structured format, where each row includes:
- project_id
- role_id
- role_name
- role_objective (0–many per role_id)
- pain_point (0–many per role_id)
- tools (0–many per role_id)
- additional_context (from Tab 5, applies universally to the project)

### What You Must Generate
For each **unique role_id**, produce a psychologically rich profile with the following sections:

1. **Role Name**
   Use the role name provided in Tab 1.

2. **Role Summary (Generated)**
   A 3–5 sentence psychological interpretation of the role's identity, pressures, motivations, and environmental context, informed by all available data.

3. **Pain Points (From Data)**
   List all pain points exactly as provided for that role_id.

4. **Tools (From Data)**
   List all tools used by this role.

5. **Needs (Generated)**
   Infer the underlying human needs based on:
   - pain points
   - role objectives
   - tools
   - project-level contextual information (Tab 5)
   Needs should be psychologically grounded (e.g., cognitive needs, emotional needs, workflow needs, autonomy, predictability, clarity, control).

6. **Key Use Cases (Generated)**
   Describe 3–5 key scenarios in which this role interacts with systems or must solve problems.
   These should be consistent with the pain points, objectives, and context.

7. **Behavioral Patterns (Generated)**
   Describe typical behavioral tendencies for this role in the context of their work.
   Examples: decision-making style, coping strategies, communication tendencies, workarounds, persistence, frustration patterns, etc.

### Rules and Constraints
- Do **not** invent data that contradicts the dataset.
- It is acceptable to infer needs, patterns, and scenarios, but they must be grounded in the real context.
- A single role_id may appear many times—aggregate all entries.
- A role profile must not mix data from different role_ids.
- The project_id will be consistent across all tabs; use project-level context to enrich all profiles.
- Do **not** summarize the dataset. Your output must be *fully rewritten*, not copied.

### Output Format
Return only the following structure, repeated for each unique role_id:

---
## **Role Profile: {role_name} ({role_id})**

### **1. Role Summary (Generated)**
{psychologically rich summary}

### **2. Pain Points (From Data)**
- {pain_point_1}
- {pain_point_2}
- …

### **3. Tools (From Data)**
- {tool_1}
- {tool_2}
- …

### **4. Needs (Generated)**
- {need_1}
- {need_2}
- …

### **5. Key Use Cases (Generated)**
1. {use_case_1}
2. {use_case_2}
3. {use_case_3}

### **6. Behavioral Patterns (Generated)**
- {behavior_1}
- {behavior_2}
- …
---

### Do not begin generating profiles until I provide the dataset.`;

export const PROMPT_2_HUMAN_PROBLEM = `#Role
You are an expert product strategist with deep experience identifying real customer needs, uncovering opportunity areas, and synthesizing complex qualitative and quantitative inputs into clear, compelling human problem statements.

Your task is to generate a **Human Problem Statement** using the structured dataset I will provide. The dataset is organized across multiple tabs, with the following schema:
- **Tab 1:** project_id, role_id, role_name
- **Tab 2:** project_id, role_id, role_objective
- **Tab 3:** project_id, role_id, pain_point
- **Tab 4:** project_id, role_id, tools
- **Tab 5:** project_id, additional_context, category
  (General Description, External Complexifiers, Starting Hypotheses, Data Details)

### Your Goal
Synthesize all available information into a single, cohesive **Human Problem Statement** that articulates:
1. **Who** is experiencing the problem (anchor in roles and their context)
2. **What pain or friction** they are experiencing
3. **Why** the problem exists (systemic, operational, or environmental factors)
4. **What negative outcomes** it creates for them (emotional, cognitive, operational, financial)
5. **What underlying needs** are going unmet

This statement should reflect both:
- **Direct data** from the dataset (pain points, roles, tools, objectives)
- **Inferred insights** based on patterns, behaviors, and contextual constraints provided in Tab 5

### Inputs You Will Receive
I will provide the full dataset in a structured format. Each row may include:
- project_id
- role_id
- role_name
- role_objective
- pain_point
- tools
- additional_context

### What You Must Generate
Produce a single, polished **Human Problem Statement** that:
- Synthesizes across **all roles**, not just one
- Focuses on the **human**, not the technology
- Frames the problem as a **core unmet need**, not a list of symptoms
- Highlights the **environmental and contextual forces** shaping the problem
- Avoids technical jargon unless it clarifies the human experience
- Is written in clear, persuasive, strategically oriented language

### Output Format
Return your output using the following structure:

## **Human Problem Statement**
{3–6 sentence synthesis describing the human problem across roles}

## **Underlying Needs (Generated)**
- {need_1}
- {need_2}
- {need_3}

## **Key Contextual Forces (From Data + Inferred)**
- {context_factor_1}
- {context_factor_2}
- {context_factor_3}

### Rules & Constraints
- Do **not** copy dataset text verbatim; synthesize and rewrite.
- Do **not** produce multiple problem statements. Create **one unified statement**.
- Ensure the problem reflects the **lived experience** of the roles represented.
- Only use information grounded in the dataset.

### Do not begin generating the Human Problem Statement until I provide the dataset.`;

export const PROMPT_3_BUSINESS_PROBLEM = `# Prompt: Update a Business Problem Statement

**Role**
You are an **expert business strategist** with deep experience in synthesizing complex information, clarifying strategic intent, and reframing business problems to reflect new insights. Your job is to **update an existing business problem statement** using newly provided information. You will produce a revised problem statement that is clearer, more accurate, and more strategically aligned.

---

## Instructions

You will receive:
1. **The current business problem statement**
2. **New information** that must be incorporated into an updated version

Your task is to:
- Rewrite the problem statement to fully integrate the new information
- Preserve any parts of the original statement that remain valid
- Strengthen clarity, coherence, and strategic focus
- Remove any elements invalidated by the new information
- Do **not** simply append new content; produce a clean, unified statement
- Write with precision, executive-level tone, and strategic framing

---

## Output Format

### **Updated Business Problem Statement**
{Your revised, fully integrated problem statement — 3 to 6 sentences}

### **Summary of Changes (Generated)**
- {bullet summarizing what was updated}
- {bullet summarizing what was clarified or removed}
- {bullet summarizing strategic implications}

---

## Inputs

**Original Statement:**
[The original business problem statement is in the separately uploaded document from the previous workshop.]

**New Information:**
[Use the outputs from Prompts 1 and 2 (Role Profiles and Human Problem Statement) that are already in your conversation context.]`;

export const PROMPT_4_SOLUTION_HYPOTHESES = `#Role
You are an expert experiment designer and product strategist. You specialize in turning complex business and human problems into clear, testable solution hypotheses that teams can validate through structured experimentation.

Your task is to generate **Solution Hypotheses** using the inputs I will provide:
1. **Business problem context**
2. **Human problem context** (problem statements, role profiles, needs, behaviors, pain points)
3. **Profiles**

### Your Goal
Produce a set of **testable, falsifiable solution hypotheses** that articulate:
- A potential solution direction
- The specific human need it addresses
- The expected positive outcome (what will improve)
- The measurable signal that would confirm or disconfirm the hypothesis

Each hypothesis should be concise, actionable, and grounded in both business and human context.

### Hypothesis Format (You Must Use This Format)
Write each hypothesis using the structure:

**If** we provide {solution concept or intervention},
**then** {specific user group} will {expected behavioral or experiential change},
**because** {underlying human need or pain point it addresses}.
**We will know this is true when** {measurable indicator or metric}.

### Requirements
- Generate **5–8 solution hypotheses**.
- Hypotheses must be **testable**, **falsifiable**, and **tied directly to human needs**.
- Avoid vague or generic statements; be specific about the intervention and the expected change.
- Each hypothesis should target **one human need** and **one expected outcome**.
- Use only information grounded in the business and human problem context I provide.

### Output Format
Return your output using this structure:

## **Solution Hypotheses**

1. **Hypothesis 1**
   If … then … because …
   *We will know this is true when …*

2. **Hypothesis 2**
   If … then … because …
   *We will know this is true when …*

(continue for all hypotheses)

### Inputs
**Business Problem Context:**
[Use the Updated Business Problem Statement generated from Prompt 3, already in your conversation context.]

**Human Problem Context:**
[Use the Human Problem Statement and Role Profiles generated from Prompts 1 and 2, already in your conversation context.]

### Do not begin generating hypotheses until you have reviewed all prior context.`;

export const PROMPT_5_SOLUTION_IDEAS_DVF = `# ROLE
You are an AI agent designed to generate high-quality solution ideas based on a problem statement and proto-persona. Your purpose is to help product teams explore possible ways to address user needs, pain points, workflow challenges, and business problems before committing to detailed design or research.

In addition, you must evaluate each idea using the Desirable / Viable / Feasible (DVF) framework to help teams understand which ideas are strong, weak, or need further exploration.

# OBJECTIVE
Your goals are to:
- Analyze the problem statement and proto-persona together.
- Brainstorm a diverse set of potential solution concepts that could address the user's needs, pains, goals, and behaviors.
- Ensure each solution clearly connects back to elements of both the problem statement and the proto-persona.
- Generate solutions that are creative but still realistic within typical product, organizational, or technical constraints.
- Evaluate each solution using the DVF framework.

Avoid:
- Suggesting solutions unrelated to the user or the defined problem.
- Repeating the problem statement or persona content without transforming it into actionable ideas.
- Making assumptions not supported by the input **unless explicitly labeled as**: **[Assumption: … ]**.

# INSTRUCTIONS

## Ideation Rules
1. Use insights from the problem statement and proto-persona to guide your ideation.
2. Brainstorm solutions across a range of dimensions (workflow, UI/UX, automation, data, communication, integrations, education, operations, etc.).
3. Each solution must:
   - Be user-centered and tied to something in the problem statement or persona.
   - Be described clearly in 2–4 sentences.
   - Include a brief note: **"Why this solves the problem:"** explaining which needs/pains/goals it addresses.
4. If you introduce any idea not directly supported by the inputs, explicitly mark it as: **[Assumption: … ]**
5. Write in concise, plain language suitable for product and design teams.

## Evaluation Rules (Desirable / Viable / Feasible)
For each idea, evaluate it using the DVF framework.

### 1. Desirable (User Value & Experience)
Assess:
- Alignment with user needs, pains, goals, behaviors
- Workflow fit and usability
- Value, usefulness, or likelihood of adoption
- Required behavior change
- Emotional drivers such as trust or confidence

Output:
- 2–4 sentence analysis
- A rating: **High / Medium / Low**
- Explicit assumptions when needed

### 2. Viable (Business & Outcomes)
Assess:
- Alignment to business strategy, metrics, ROI
- Financial impact or cost–benefit expectations
- Regulatory/compliance considerations
- Fit with organizational priorities
- Scalability and segment fit

Output:
- 2–4 sentence analysis
- A rating: **High / Medium / Low**
- Explicit assumptions when needed

### 3. Feasible (Tech, Data, Ops)
Assess:
- Data availability and access constraints
- Technical complexity and integration feasibility
- Fit with existing tools/platform constraints
- Operational dependencies or workflow changes
- Risks, blockers, or unknowns

Output:
- 2–4 sentence analysis
- A rating: **High / Medium / Low**
- Explicit assumptions when needed

# Required DVF Output Structure
For each idea, output the following sections:

## **DVF Evaluation**
**Desirable:** Rating + analysis
**Viable:** Rating + analysis
**Feasible:** Rating + analysis
**Risks & Unknowns:** Bullet list

## **Overall Recommendation:**
- **Proceed**
- **Explore further**
- **Deprioritize**

### Inputs
**Problem Statement:**
[Use the Updated Business Problem Statement and Human Problem Statement from Prompts 2 and 3, already in your conversation context.]

**Proto-Persona:**
[Use the Role Profiles generated from Prompt 1, already in your conversation context.]`;

/** All prompts indexed by sheet number (2–6). */
export const PROMPTS: Record<number, { title: string; text: string }> = {
  2: { title: 'Prompt 1 — Role Profiles', text: PROMPT_1_ROLE_PROFILES },
  3: { title: 'Prompt 2 — Human Problem Statement', text: PROMPT_2_HUMAN_PROBLEM },
  4: { title: 'Prompt 3 — Business Problem Update', text: PROMPT_3_BUSINESS_PROBLEM },
  5: { title: 'Prompt 4 — Solution Hypotheses', text: PROMPT_4_SOLUTION_HYPOTHESES },
  6: { title: 'Prompt 5 — Solution Ideas & DVF Evaluation', text: PROMPT_5_SOLUTION_IDEAS_DVF },
};
