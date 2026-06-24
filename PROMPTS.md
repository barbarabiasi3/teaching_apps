# PROMPTS.md

## Purpose

This file stores reusable prompt templates for MBA microeconomics learning apps. The prompts can be used for pre-generating static content, powering optional LLM features, or guiding future app development.

The default voice is concise, intuitive, example-driven, and suitable for a core MBA economics course.

## Shared Variables

Use these placeholders consistently:

- `{topic}`: Microeconomics topic, such as "tax incidence" or "monopoly pricing."
- `{learning_objective}`: Specific student capability the app is trying to build.
- `{student_level}`: Expected background, usually "MBA students with varied quantitative preparation."
- `{case_context}`: Business or policy setting for the example.
- `{model_objects}`: Curves, equations, constraints, players, or payoffs used in the model.
- `{widget_state}`: Current values of sliders, toggles, selected answers, or graph positions.
- `{student_answer}`: Student response to a quiz or prompt.
- `{correct_answer}`: Correct response or target reasoning.
- `{misconception}`: Likely mistaken belief.
- `{tone}`: Style constraint, usually "clear, direct, professional, encouraging."

## Base System Prompt

```text
You are a senior economist teaching intermediate microeconomics in a core MBA course at an Ivy League business school. You are also an expert builder of simple teaching apps.

Your job is to help MBA students understand the intuition, managerial relevance, and formal logic of microeconomic models.

Use plain language first, then notation only when useful. Keep explanations short, concrete, and example-driven. Do not talk down to students. Connect the concept to business decisions when possible. If an example is hypothetical, say so. Separate what the model assumes from what real-world managers would still need to investigate.
```

## Prompt Template: Concept Explanation

```text
Using the base teaching voice, explain `{topic}` to `{student_level}`.

Learning objective:
{learning_objective}

Relevant model objects:
{model_objects}

Use this structure:
1. One-sentence intuition.
2. A compact business example using `{case_context}`.
3. What a student should look for on the graph or in the equation.
4. One common mistake.
5. One check-your-understanding question.

Keep the response under 220 words.
```

## Prompt Template: App State Explanation

```text
Explain the current state of an interactive microeconomics widget.

Topic:
{topic}

Learning objective:
{learning_objective}

Current widget state:
{widget_state}

Write a short explanation that tells the student:
1. What changed.
2. Why the economic outcome changed.
3. What the managerial or policy takeaway is.
4. One thing to try next in the widget.

Keep the response under 160 words. Use no more than one equation.
```

## Prompt Template: MBA Case Example

```text
Create a short hypothetical MBA-style case for `{topic}`.

Learning objective:
{learning_objective}

Case context:
{case_context}

The case should include:
1. A named decision maker.
2. A concrete decision.
3. The relevant economic tradeoff.
4. Two numbers or qualitative parameters the student can vary.
5. A debrief explaining what the model predicts.

Keep it realistic, compact, and self-contained. Do not use real company facts unless they are supplied in the prompt.
```

## Prompt Template: Quiz Question

```text
Write one quiz question for an MBA microeconomics app.

Topic:
{topic}

Learning objective:
{learning_objective}

Current widget state, if relevant:
{widget_state}

Requirements:
- Use one multiple-choice question with four answer choices.
- Make the wrong choices plausible.
- Include the correct answer.
- Explain the correct answer in two or three sentences.
- Explain why each distractor is tempting in one sentence.
- Avoid trick wording.
```

## Prompt Template: Short Answer Grading

```text
Evaluate the student's short answer.

Topic:
{topic}

Prompt the student answered:
{learning_objective}

Student answer:
{student_answer}

Correct target reasoning:
{correct_answer}

Return:
1. A score from 0 to 3.
2. One sentence naming what the student got right.
3. One sentence naming the most important missing or incorrect idea.
4. A revised answer of 40-70 words.

Be encouraging but precise.
```

## Prompt Template: Misconception Repair

```text
Repair this misconception for an MBA student.

Topic:
{topic}

Misconception:
{misconception}

Correct idea:
{correct_answer}

Use this structure:
1. Why the misconception is tempting.
2. The clean correction.
3. A tiny example.
4. A one-question diagnostic check.

Keep the response under 150 words.
```

## Prompt Template: Socratic Hint Ladder

```text
Create a three-step hint ladder for a student who is stuck.

Topic:
{topic}

Learning objective:
{learning_objective}

Current widget state or problem:
{widget_state}

The hints should become progressively more explicit:
Hint 1: Point attention to the relevant object.
Hint 2: Name the economic force at work.
Hint 3: Give the key step without fully solving any arithmetic unless necessary.

Keep each hint under 35 words.
```

## Prompt Template: Graph Reading Drill

```text
Create a graph-reading drill for `{topic}`.

Graph or model objects:
{model_objects}

Learning objective:
{learning_objective}

Return:
1. A prompt asking the student to identify an object on the graph.
2. A prompt asking the student to predict what moves after a parameter change.
3. A prompt asking the student to interpret welfare or profit consequences.
4. Concise answer key.

Use language that can sit next to an interactive chart.
```

## Prompt Template: Compare Two Worlds

```text
Compare two economic scenarios for `{topic}`.

Scenario A:
{widget_state}

Scenario B:
{case_context}

Explain:
1. What changed.
2. Which outcome is higher or lower.
3. Who benefits and who loses.
4. What assumption drives the result.

Keep the response under 180 words and use a managerial example.
```

## Suggested First MVP App

### Supply, Demand, and Welfare Sandbox

Topic:
Competitive equilibrium, comparative statics, surplus, tax incidence, and deadweight loss.

Why this first:

- It is foundational for later apps on market power, externalities, price discrimination, and policy.
- Students get an immediate payoff from moving demand, supply, and tax sliders.
- It supports visual intuition and exam-style practice.
- It can be implemented as a static JavaScript app with no backend.

Core features:

- Demand and supply sliders for intercepts and slopes.
- Live equilibrium price and quantity.
- Consumer surplus, producer surplus, tax revenue, and deadweight loss areas.
- Toggle for per-unit tax on buyers or sellers.
- Short explanation panel generated from the current widget state.
- Three-question quiz mode: graph reading, comparative statics, and welfare interpretation.

Required agents:

- Course Director: pins the learning objectives and acceptable simplifications.
- Interactive Designer: maps sliders to curves and visual feedback.
- Intuition Coach: writes the short state explanations.
- Quizmaster: creates graph-reading and welfare questions.
- Misconception Detector: explains common tax incidence mistakes.
- App Engineer: builds the static implementation.
- Accessibility Reviewer: checks the widget before publishing.

Required prompts:

- Base System Prompt
- App State Explanation
- Quiz Question
- Misconception Repair
- Graph Reading Drill
- Compare Two Worlds

Initial learning objective:

Students should be able to predict how shifts in supply, shifts in demand, and per-unit taxes change equilibrium price, quantity, surplus, tax revenue, and deadweight loss.

Initial misconception to target:

"The side of the market that writes the tax check bears the tax burden."

Initial business framing:

A marketplace operator is deciding whether a new fee should be charged to sellers or buyers, while anticipating how much of the fee will be passed through in prices.

