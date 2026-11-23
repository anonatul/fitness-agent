# Running

## Purpose

Running is a long-term component of the user's fitness system.

The current priority is not race performance.

The goals are:

- Build aerobic fitness
- Improve running economy
- Maintain regular running
- Improve general athleticism
- Gradually increase endurance
- Eventually become comfortable running 21.1 km
- Maintain that capability without making running the dominant training goal

The agent should treat running as an adaptive training system rather than
a fixed race plan.

---

# 1. Current Running Structure

The default structure is:

- 1 easy aerobic run
- 1 quality run
- 1 long easy run

This provides exposure to different endurance qualities without requiring
every run to be hard.

The structure can change based on:

- Recovery
- Strength training
- Running history
- Pain
- Availability
- Current phase
- Performance

---

# 2. Easy Run

The easy run develops aerobic capacity while keeping fatigue relatively
manageable.

Characteristics:

- Comfortable effort
- Controlled breathing
- Conversational intensity
- Sustainable pace
- Low-to-moderate RPE

The exact pace is not fixed.

Weather, terrain, sleep, fatigue, and fitness can all change the pace at
the same effort.

---

# 3. Quality Run

The quality run provides a higher-intensity stimulus.

Possible formats include:

- Intervals
- Tempo running
- Threshold-style work
- Hill repetitions
- Progression runs
- Fartlek

The agent should select the format based on the current phase and recent
training.

Quality running should have a clear purpose.

Harder does not automatically mean better.

---

# 4. Long Easy Run

The long run develops endurance and tolerance for longer periods of
continuous running.

The long run should generally remain easy.

Its primary purpose is not to test maximum distance every week.

The agent should progress duration or distance gradually according to the
user's recovery and recent running history.

---

# 5. Running Intensity

Running intensity can be monitored using:

- RPE
- Pace
- Heart rate
- Talk test
- Breathing
- Terrain

No single metric is perfect.

The agent should combine available information.

---

# 6. RPE for Running

A practical running RPE scale:

- 1–2 = extremely easy
- 3 = easy
- 4 = comfortable
- 5 = moderate
- 6 = moderately hard
- 7 = hard
- 8 = very hard
- 9 = extremely hard
- 10 = maximal

Approximate training use:

### Easy running

Usually around RPE 3–4.

### Moderate running

Around RPE 5–6.

### Quality work

Often around RPE 6–9 depending on the workout.

### Maximal effort

RPE 10.

The agent should avoid treating these values as rigid physiological
boundaries.

---

# 7. Talk Test

The talk test is a practical way to estimate running intensity.

If the user can comfortably speak in complete sentences, the effort is
generally easy enough for aerobic work.

If speaking becomes difficult, intensity is increasing.

The talk test is especially useful when heart-rate data is unavailable or
unreliable.

---

# 8. Pace

Pace is useful for tracking progress.

However, pace should not be interpreted without context.

A slower pace can result from:

- Heat
- Humidity
- Hills
- Fatigue
- Poor sleep
- Wind
- Dehydration
- Surface
- Recovery state

Therefore:

**Same pace ≠ same effort**

and

**Faster pace ≠ automatically better training.**

---

# 9. Heart Rate

Heart rate can provide additional information about running intensity.

Useful measurements include:

- Average HR
- Maximum HR
- HR during easy runs
- HR at comparable paces
- Recovery trends

The agent should prioritize trends from comparable sessions rather than
isolated values.

---

# 10. Running Economy

Running economy describes how efficiently the body uses energy at a given
running speed.

It can improve through:

- Consistent running
- Appropriate training
- Strength development
- Technique development
- Gradual exposure to running

The agent should not turn technique into a collection of unnecessary
form corrections.

Running should generally look natural and controlled.

---

# 11. Running Consistency

Consistency is more important than occasional heroic sessions.

A user who runs moderately and consistently will generally build more
useful endurance than someone who repeatedly alternates between excessive
training and long breaks.

The agent should prioritize sustainable training.

---

# 12. Running Volume

Running volume can be measured using:

- Distance
- Time
- Number of sessions
- Long-run duration

Distance alone is not sufficient to describe training stress.

A 5 km easy run and a 5 km hard interval session do not create the same
training demand.

---

# 13. Running Load

The agent should consider both:

### External load

What the user actually did:

- Distance
- Duration
- Pace
- Elevation
- Intervals

### Internal load

How difficult it was:

- RPE
- Heart rate
- Breathing
- Fatigue

The combination provides a better picture than either alone.

---

# 14. Progression

Running progression can occur through:

- Greater total distance
- Longer easy runs
- More total running time
- Improved pace at the same effort
- More quality work
- Better recovery at the same workload

The agent should not increase every variable simultaneously.

---

# 15. Distance Progression

Distance should increase according to the user's recent training history.

The system should consider:

- Current weekly distance
- Longest recent run
- Number of recent running sessions
- Recent breaks
- Recovery
- Lower-leg condition
- Strength training load

There is no requirement to increase distance every week.

---

# 16. Intensity Progression

Quality running can progress through:

- More repetitions
- Longer intervals
- Slightly faster intervals
- More total quality time
- Reduced recovery
- More demanding terrain

Usually only one major variable should change at a time.

---

# 17. Long-Run Progression

The long run should progress gradually.

The agent should avoid:

- Large jumps in distance
- Frequent maximal-distance tests
- Increasing distance and intensity together
- Ignoring lower-leg fatigue

The goal is to expand endurance capacity while remaining recoverable.

---

# 18. Aerobic Base

Aerobic development comes primarily from consistent endurance work.

The agent should build the base through repeated manageable sessions.

The user does not need every run to feel impressive.

A large amount of useful aerobic development comes from controlled,
repeatable work.

---

# 19. Quality vs Quantity

More running is not automatically better.

More distance may increase:

- Recovery demands
- Lower-body fatigue
- Injury risk
- Interference with strength training

The agent should increase volume only when the additional training has a
reasonable benefit.

---

# 20. Running and Strength Priority

Because strength/muscle is currently the primary goal, running should not
consume unlimited recovery capacity.

If running starts interfering with strength progression, the agent should
evaluate:

- Running volume
- Running intensity
- Lower-body strength volume
- Session spacing
- Nutrition
- Sleep

The correct solution is not automatically to stop running.

---

# 21. Easy Run + Strength

An easy run can often coexist with strength training because its recovery
cost is lower than that of a hard run.

However, the agent should still consider total lower-body fatigue.

---

# 22. Quality Run + Strength

Quality running creates greater fatigue.

If a quality run and lower-body strength session are too close together,
performance in one or both may decline.

The agent should separate demanding sessions when practical.

---

# 23. Long Run + Strength

Long runs can create substantial lower-body fatigue even when performed
at an easy pace.

The agent should consider the long run when deciding subsequent lower-body
training volume.

---

# 24. Running After a Break

When returning after a significant break, the agent should not immediately
resume the previous training load.

Instead:

1. Re-establish consistency.
2. Use manageable distance.
3. Keep most running easy.
4. Monitor recovery.
5. Gradually rebuild volume.
6. Reintroduce harder work when appropriate.

Previous fitness does not guarantee immediate tolerance to previous
training volume.

---

# 25. Running With Fatigue

If the user is mildly fatigued but otherwise healthy:

The agent may:

- Reduce distance
- Slow the pace
- Remove intervals
- Convert the session to an easy run

If fatigue is substantial:

The session may need to be postponed or replaced with recovery.

---

# 26. Running With Pain

Pain must be treated differently from normal effort.

Warning signs include:

- Sharp pain
- Persistent pain
- Worsening pain while running
- Altered running mechanics
- Significant joint or tendon pain
- Pain that continues after training
- Loss of normal function

The agent should not diagnose the cause.

Persistent, severe, worsening, or function-limiting pain should be
assessed by an appropriate healthcare professional.

---

# 27. Lower-Leg Management

The user's running history includes previous shin discomfort.

Therefore the agent should pay particular attention to:

- Recent running volume
- Long-run progression
- Surface
- Footwear condition
- Recovery
- Pain location
- Pain progression

The system should avoid treating previous tolerance as proof that current
loading is safe.

---

# 28. Running Shoes

Shoes are a practical equipment variable.

The agent can track:

- Shoe model
- Approximate mileage
- Condition
- Comfort
- Any recurring discomfort associated with a shoe

Shoe mileage should not be treated as an automatic replacement threshold.

Condition and user response matter.

---

# 29. Terrain

Terrain changes running demand.

Examples:

- Hills increase muscular demand.
- Trails introduce uneven surfaces.
- Heat increases physiological stress.
- Hard surfaces may feel different from softer surfaces.

The agent should consider terrain when comparing sessions.

---

# 30. Running in Heat

Hot and humid conditions can increase perceived effort and heart rate.

Therefore the agent should avoid judging fitness purely from pace under
different environmental conditions.

When conditions are difficult, effort should generally guide the session
more than a fixed pace target.

---

# 31. Running Metrics

Useful metrics include:

- Distance
- Duration
- Average pace
- Average HR
- RPE
- Elevation
- Route
- Session type
- Longest recent run
- Weekly running volume

The agent should avoid tracking metrics that do not influence decisions.

---

# 32. Post-Run Logging

After each run, ideally record:

- Date
- Session type
- Distance
- Duration
- Pace
- HR if available
- RPE
- Weather/terrain when relevant
- Pain/discomfort
- How the session felt
- Recovery afterward

This gives the agent enough information to adapt future sessions.

---

# 33. Running Progress Evaluation

Improvement can appear as:

- Faster pace at the same effort
- Lower HR at the same pace
- Lower RPE at the same pace
- Longer distance at similar effort
- Better recovery
- Better consistency
- Greater long-run tolerance

Running progress is not only about running faster.

---

# 34. When to Increase Running Load

Increase running load when:

- Recent sessions are being completed consistently.
- Recovery is good.
- No concerning pain is present.
- Performance is stable or improving.
- Current workload feels manageable.

Increase gradually rather than automatically.

---

# 35. When to Maintain Running Load

Maintain current running load when:

- Recovery is acceptable.
- Fitness is improving.
- The user is adapting to the current workload.
- Strength training needs more recovery resources.
- The current amount of running is already sufficient for the phase.

No progression is required simply because a new week has started.

---

# 36. When to Reduce Running Load

Reduce running stress when:

- Performance repeatedly declines.
- Lower-body fatigue is high.
- Pain is increasing.
- Recovery is poor.
- Strength progress is being significantly affected.
- Life stress or illness reduces recovery capacity.

Reduction can involve:

- Less distance
- Easier intensity
- Fewer intervals
- Shorter long run
- Temporary reduction in frequency

---

# 37. Half Marathon Capability

The long-term objective is to comfortably complete 21.1 km.

The path is:

Consistency
→ Aerobic base
→ Longer easy runs
→ Increased endurance
→ Greater long-run tolerance
→ 21.1 km capability

There is no need to maintain a dedicated half-marathon training block
forever.

Once the capability is developed, the user can return emphasis toward
strength while maintaining enough running to preserve endurance.

---

# 38. Running Phase Changes

The running system can shift emphasis.

### General Fitness Phase

Moderate running volume with balanced strength training.

### Endurance Development Phase

Greater emphasis on:

- Running volume
- Long-run development
- Aerobic development
- Running-specific quality

### Half Marathon Preparation Phase

More specific long-run and quality progression may be introduced.

### Maintenance Phase

Lower running volume can maintain useful endurance after the desired
capability is established.

The agent should only enter a race-specific phase when the user actually
needs it.

---

# 39. Decision Rules

### If easy running feels easy and recovery is good:

Maintain or gradually increase volume.

### If easy running becomes unusually difficult:

Check recovery, environment, illness, and recent training load.

### If quality sessions repeatedly deteriorate:

Reduce intensity or volume and investigate recovery.

### If long runs are progressing comfortably:

Continue gradual progression.

### If long-run recovery is poor:

Reduce long-run stress before increasing it further.

### If pain increases:

Do not progress running load.

### If strength is suffering while running load rises:

Review total concurrent training stress.

### If running is progressing without excessive fatigue:

Continue the current balance.

---

# 40. Core Principle

Running progression is built through **consistent, recoverable exposure**.

The objective is not to make every run faster.

The objective is to become capable of running farther and better while
maintaining strength, muscle, recovery, and long-term consistency.

**Build the aerobic engine without sacrificing the rest of the athlete.**