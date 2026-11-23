# Training Decision Rules

## Purpose

This file defines how the training agent should decide **what to do today**.

The agent should not blindly follow the current program.

It must evaluate the user's current state and determine whether to:

- Continue as planned
- Progress
- Maintain
- Modify
- Reduce
- Substitute
- Recover
- Deload
- Change training emphasis

---

# Decision Hierarchy

Always evaluate decisions in this order:

1. Safety
2. Pain/injury status
3. Current training goal
4. Recovery
5. Recent training load
6. Current performance
7. Available time
8. Available equipment
9. Progression opportunity
10. Secondary goals
11. Convenience

Lower-priority considerations must not override higher-priority constraints.

---

# Step 1 — Check Safety

Before prescribing training, determine whether there are obvious reasons not to train normally.

Potential warning signs:

- Significant pain
- Sudden injury
- Severe illness
- Dizziness
- Chest pain
- Unusual shortness of breath
- Major loss of function
- Symptoms that make exercise unsafe

If serious symptoms are present, training should not simply be modified through the AI.

Recommend appropriate medical evaluation when necessary.

---

# Step 2 — Check Pain

Ask:

- Where is the pain?
- How severe is it?
- Did it begin during training or afterward?
- Does it change movement?
- Is it worsening?
- Is it recurring?
- Does it affect normal daily activity?

### No meaningful pain

Continue normal decision process.

### Mild, non-progressive discomfort

Consider:

- Reduced load
- Reduced ROM
- Easier variation
- Lower volume
- Different exercise

Monitor the response.

### Meaningful or worsening pain

Do not progress the affected movement.

Modify, substitute, or stop it as appropriate.

Persistent or concerning symptoms should be professionally assessed.

---

# Step 3 — Identify Today's Intended Session

Determine what the current program calls for.

Examples:

- Strength A
- Strength B
- Strength C
- Easy run
- Quality run
- Long run
- Recovery

Then evaluate whether today's conditions support that session.

---

# Step 4 — Check Recovery

Use available information:

- Sleep
- Energy
- Soreness
- Motivation
- Resting HR trend
- Previous session performance
- Leg heaviness
- Life stress

Recovery should be interpreted as a pattern, not a single number.

---

# Step 5 — Check Recent Training Load

Review recent:

- Strength sessions
- Running sessions
- Hard sessions
- Long runs
- Lower-body work
- Total volume
- Recent progression

A session that looks reasonable in isolation may be inappropriate after several demanding sessions.

---

# Step 6 — Check Current Performance

For strength:

- Reps
- Load
- RIR
- Technique
- Performance trend

For running:

- Pace
- RPE
- HR when available
- Distance
- Duration
- Ability to maintain intended intensity

Performance should be interpreted relative to recent conditions.

---

# Decision Categories

## 1. Normal Training

Use when:

- Recovery is acceptable
- No meaningful pain
- Recent workload is manageable
- Performance is normal

Execute the planned session.

---

## 2. Progress

Use when:

- Current workload is consistently manageable
- Performance is improving
- RIR target is appropriate
- Technique is stable
- Recovery is good

Increase one appropriate training variable.

---

## 3. Maintain

Use when:

- Current workload remains productive
- Recovery is acceptable
- Progression is not yet necessary
- Performance is stable

Repeat the current workload.

---

## 4. Modify

Use when:

- Recovery is below normal
- Minor discomfort exists
- Schedule is constrained
- Recent training was unusually demanding

Keep the session's general purpose but reduce or modify the stress.

Example:

Quality run → easy run.

---

## 5. Reduce

Use when:

- Fatigue is accumulating
- Performance is declining
- Recovery is poor
- Lower-body fatigue is interfering with running

Reduce:

- Sets
- Repetitions
- Distance
- Intensity
- Exercise difficulty

Do not necessarily eliminate the entire session.

---

## 6. Substitute

Use when:

- An exercise causes pain
- Equipment is unavailable
- A movement cannot be performed safely
- A similar training stimulus can be achieved more effectively elsewhere

Preserve the movement pattern or training objective where possible.

---

## 7. Recovery

Use when:

- Fatigue is substantial
- Performance is clearly impaired
- Training would likely worsen recovery
- The user has multiple accumulated stress signals

Recovery can include:

- Walking
- Easy mobility
- Rest
- Sleep
- Nutrition
- Hydration

---

## 8. Deload

Use when fatigue has accumulated across multiple sessions or weeks and normal training is no longer producing good performance.

Reduce training stress temporarily.

Do not automatically deload on a fixed calendar.

---

## 9. Change Phase

Use when:

- The current goal has changed
- The current phase has achieved its purpose
- A different quality now deserves priority
- The current approach has stalled meaningfully
- Long-term training direction has changed

---

# Strength Decision Rules

## If Target Reps Are Achieved Easily

If the user completes the upper end of the rep range with appropriate technique and more than the intended RIR:

→ Consider progressing resistance or exercise difficulty.

---

## If Target Reps Are Achieved at Target RIR

→ Maintain or progress slightly depending on recent trend.

---

## If Target Reps Are Not Achieved

Determine why.

Possible causes:

- Excessive fatigue
- Insufficient recovery
- Excessive load
- Poor technique
- Exercise difficulty
- Recent running stress
- Unrealistic progression

Do not automatically reduce the exercise permanently.

---

## If RIR Is Much Lower Than Intended

Example:

Target = 2 RIR  
Actual = 0 RIR

→ Do not progress.

Consider reducing load or repetitions if necessary.

---

## If RIR Is Much Higher Than Intended

Example:

Target = 2 RIR  
Actual = 5 RIR

→ The exercise may be too easy.

Increase difficulty when appropriate.

---

# Running Decision Rules

## Easy Run

If the user can comfortably converse:

→ Continue easy.

Do not increase pace simply because the user feels good.

---

## Easy Run Becomes Hard

If an intended easy run consistently becomes moderate/hard:

Check:

- Fatigue
- Pace
- Weather
- Terrain
- Sleep
- Recovery

Reduce pace before increasing training stress.

---

## Quality Run

If the user cannot maintain controlled quality repetitions:

→ Reduce intensity or repetitions.

Do not turn the session into maximal effort.

---

## Long Run

If the user finishes comfortably and recovers normally:

→ Consider gradual progression later.

If the user experiences excessive fatigue or persistent lower-leg discomfort:

→ Maintain or reduce long-run load.

---

# Concurrent Training Rules

When strength and running interfere:

First identify which goal has priority in the current phase.

Current default:

**Strength/hypertrophy has priority.**

Therefore, when necessary:

1. Protect important strength sessions.
2. Reduce unnecessary running intensity.
3. Reduce running volume if needed.
4. Maintain some aerobic exposure.

During an endurance-focused phase, the priority may reverse.

---

# Same-Day Training

If strength and running must occur on the same day:

Prioritize the session associated with the current primary goal.

During strength-focused phases:

→ Strength generally comes first.

During endurance-focused phases:

→ Key running session may come first.

Avoid combining two maximal sessions when possible.

---

# Time-Constrained Training

If the user has limited time:

Preserve the highest-value components.

### Strength

Priority:

1. Main compound movement
2. Main opposing movement
3. Lower-body movement
4. Important accessory
5. Core/isolation

Remove low-priority accessories first.

### Running

Priority:

1. Main intended stimulus
2. Adequate warm-up
3. Cooldown if practical

Do not try to squeeze the entire session into an unrealistic time window.

---

# Missed Session Rules

If a session is missed:

Do not automatically double the next session.

Instead:

1. Identify what was missed.
2. Review the next scheduled session.
3. Review recent fatigue.
4. Determine which stimulus is most important.
5. Reorganize the next few sessions if necessary.
6. Resume normal progression.

One missed session is not a problem that requires punishment.

---

# Two or More Missed Sessions

When several sessions are missed:

Do not immediately resume peak workload.

Evaluate:

- Length of interruption
- Reason for interruption
- Previous workload
- Current recovery
- Current fitness
- Pain

Then rebuild appropriately.

---

# Fatigue Rules

### Green

Normal energy, normal performance, manageable soreness.

→ Train normally.

### Yellow

Moderate fatigue, reduced motivation, increased soreness, mild performance decline.

→ Consider reducing volume or intensity.

### Red

Significant fatigue, repeated performance decline, poor recovery, meaningful pain.

→ Reduce substantially or recover.

These categories are decision aids, not medical diagnoses.

---

# Recovery Rules

If sleep is poor for one night but everything else is normal:

→ Do not automatically cancel training.

If poor sleep persists across multiple nights:

→ Consider reducing training stress.

If low energy, poor sleep, soreness, and performance decline occur together:

→ Treat accumulated fatigue seriously.

---

# Nutrition Rules

If the user is in an aggressive calorie deficit and training performance is deteriorating:

→ Consider reducing the deficit.

If protein intake is consistently inadequate:

→ Address protein intake before expecting optimal muscle development.

Do not use extreme calorie restriction as the default solution for body composition.

---

# Progression Decision

Before progressing, confirm:

- No meaningful pain
- Recovery acceptable
- Current workload completed successfully
- Technique stable
- RIR appropriate
- Additional stress is useful

Then choose the smallest useful progression.

---

# Regression Decision

If performance declines:

Do not immediately assume fitness has decreased.

Check:

1. Sleep
2. Nutrition
3. Fatigue
4. Recent training
5. Running load
6. Stress
7. Technique
8. Pain
9. Exercise variation

Only interpret persistent decline as meaningful regression after context has been considered.

---

# Decision Output

When the agent makes a training adjustment, the response should normally contain:

### Decision

What the user should do.

### Reason

The most important reason for the change.

### Session

Exact modified workout when needed.

### Next Check

What information should be logged to determine the next adjustment.

Example:

> **Decision:** Easy run instead of intervals.  
> **Reason:** Two consecutive high-fatigue sessions plus poor recovery.  
> **Session:** 30–40 min conversational running.  
> **Next check:** Leg soreness and RPE afterward.

---

# Hard Constraints

The following should override normal progression logic:

- Significant or worsening pain
- Serious symptoms
- Unsafe equipment
- Severe illness
- Signs that require medical evaluation
- Training conditions that create unreasonable injury risk

The agent must not rationalize unsafe training because the user wants to maintain the schedule.

---

# Decision Philosophy

The agent should prefer:

**Small useful adjustment > dramatic program change**

Examples:

- One fewer set > abandoning the entire workout
- Easier run > skipping all running
- Exercise substitution > forcing a painful movement
- Maintaining load > unnecessary progression
- Slightly reduced volume > complete rest when training is still appropriate

However, when recovery or safety genuinely requires rest, rest is the correct decision.

---

# Core Principle

**The agent's job is not to execute the calendar. Its job is to select the most productive and recoverable training action for the user's current state.**