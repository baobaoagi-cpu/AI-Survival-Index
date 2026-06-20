# AI Survival Index Product Advisory Board

This document defines the external methodology references we use to supervise product planning, system architecture, UX decisions, analytics, and growth strategy.

It is not a literal copy of any author's work. It extracts decision frameworks and adapts them to this product.

## Why This Exists

AI Survival Index is moving from a local HTML prototype into an operated product:

- Cloudflare Pages frontend
- Railway API
- Supabase data layer
- Admin console
- Future LINE LIFF entry point

As the product grows, every iteration should be judged by the same strategic rules. This board gives us those rules.

## The Five Advisors

### 1. Product Strategy: Marty Cagan

Primary references:

- Silicon Valley Product Group, "Product vs Feature Teams"
- Silicon Valley Product Group, "Empowered Product Teams"

Core method:

- Teams should be given problems to solve, not only feature tickets to ship.
- Product work must balance four risks:
  - Value: will users want this?
  - Usability: can users use this naturally?
  - Feasibility: can we build and operate this?
  - Viability: does it support the business?

How we apply this:

- Every feature must name the product problem it solves.
- We do not add features only because they are technically possible.
- MVP scope should stay tied to learning, activation, sharing, retention, or revenue.

Review questions:

- What user or business problem does this solve?
- What assumption are we testing?
- Is this a product outcome or just output?
- Does this improve completion, sharing, retention, or monetization?

Current project implications:

- Admin exists to make product operation visible, not as generic CRUD.
- LINE LIFF should be added only after the web flow and tracking are clear.
- The `.dc.html` prototype is valid for learning, but not a permanent product surface.

## 2. System Architecture: Martin Fowler

Primary references:

- Martin Fowler, "Foreword to Building Evolutionary Architectures"
- Martin Fowler, "Software Architecture Guide"

Core method:

- Architecture should evolve through small changes and feedback loops.
- Systems need observable fitness functions that show whether the architecture is healthy.
- Good architecture preserves changeability.

How we apply this:

- Keep frontend, API, shared quiz logic, database, and admin separated.
- Avoid one-way dependencies that make future migration expensive.
- Add health checks, deployment checks, and data-write verification.

Review questions:

- Can this be changed later without rewriting everything?
- Is this layer doing only its own job?
- Can we verify that it works after deployment?
- Does it expose secrets or couple browser code to privileged systems?

Current project implications:

- `apps/api` owns privileged Supabase access.
- Browser apps must never receive `SUPABASE_SERVICE_ROLE_KEY`.
- `packages/shared` owns archetype data and quiz scoring logic.
- Cloudflare Pages and Railway should remain replaceable deployment targets.

## 3. UX and Game Feel: Don Norman

Primary references:

- Don Norman, human-centered design principles
- Don Norman, "The Design of Everyday Things"

Core method:

- Understand the real human problem before designing the interface.
- Make actions visible, understandable, and recoverable.
- Use clear signifiers, constraints, feedback, and natural mapping.

How we apply this:

- The quiz is not a form. It is a guided identity-reveal ritual.
- Each screen should have one dominant action.
- Users should always understand what just happened and what to do next.

Review questions:

- Is the next action obvious?
- Is there too much text?
- Does the page feel like a LINE/PWA mini experience rather than a document?
- Does visual feedback make the result feel earned?

Current project implications:

- Result reveal should feel like a crest/identity moment.
- The friend wall should share the same crest visual language.
- Mobile is the primary design context, but desktop and tablet must not look broken.
- PWA shell and responsive stage treatment are product-quality work, not decoration.

## 4. Analytics and Operations: Avinash Kaushik

Primary references:

- Avinash Kaushik, "See, Think, Do"
- Avinash Kaushik, "See, Think, Do, Care"

Core method:

- Do not measure only final conversion.
- Measure users by intent stage:
  - See: user sees or enters the product.
  - Think: user considers participating.
  - Do: user takes the target action.
  - Care: user returns, shares, or deepens engagement.

How we apply this:

- Admin must show behavior, not just totals.
- We need event tracking across the whole user journey.
- Metrics should explain where users drop, not only how many arrived.

Review questions:

- What event will prove this feature is used?
- Where in the journey does this feature belong?
- Can Admin show failure, drop-off, and conversion?
- Are we tracking quality or only vanity totals?

Current project implications:

- Add `user_events` for:
  - opened app
  - started quiz
  - answered question
  - completed quiz
  - viewed result
  - opened friend wall
  - clicked share
  - clicked invite
  - entered membership page
- Dashboard should evolve into a funnel and cohort view.
- Question-level drop-off matters before scaling traffic.

## 5. Growth and Social Loops: Brian Balfour / Reforge

Primary references:

- Reforge, "Growth Loops are the New Funnels"
- Brian Balfour, "The Universal Growth Loop"

Core method:

- Growth should be designed as self-reinforcing loops, not only one-way funnels.
- Product output should create inputs for the next cycle.
- Retention powers sharing, invites, and monetization.

How we apply this:

- The product loop is:
  1. User completes quiz.
  2. User receives a crest identity.
  3. User shares identity to LINE.
  4. Friends enter and take the quiz.
  5. Friend results populate the user's AI friend wall.
  6. Original user returns to inspect the friend wall.

Review questions:

- Does this feature feed a loop?
- Does it create a reason to invite or return?
- Can the loop be measured?
- Does the shared artifact make others curious enough to enter?

Current project implications:

- Sharing is not a secondary feature. It is the growth engine.
- The AI friend wall is a retention surface, not only a report.
- Friend count, invite chain, share conversion, and return visits must enter Admin.
- LIFF integration should optimize the loop, not just provide login.

## LINE Implementation Constraint

Primary references:

- LINE Developers, LIFF API reference
- LINE Developers, Developing a LIFF app

Operational rules:

- LIFF is a web app running in the LINE environment.
- Sharing should use `liff.shareTargetPicker()` after LIFF login is initialized.
- LINE Developers Console must enable the share target picker.
- The product must continue to degrade gracefully outside LINE during testing.

Review questions:

- Does this work inside LINE and in normal browser testing?
- What happens before LIFF login?
- Does sharing fail gracefully?
- Can Admin distinguish LINE users from local/test users?

## Universal Decision Checklist

Before starting any meaningful feature, answer these five questions:

```text
Cagan: What product problem are we solving?
Fowler: Can this architecture evolve safely?
Norman: Will the user naturally understand what to do?
Kaushik: What event or metric proves this works?
Balfour: Does this strengthen a growth or retention loop?
```

If a proposed feature cannot answer at least three of these clearly, it should not enter the current iteration.

## Current Strategic Priority

The current product stage is Alpha formalization.

Priority order:

1. Make the Cloudflare frontend feel responsive and app-like.
2. Add PWA shell basics.
3. Add `user_events` tracking.
4. Upgrade Admin dashboard from totals to funnel visibility.
5. Connect LIFF login and LINE sharing.
6. Replace `.dc.html` screens with maintainable `apps/web` screens incrementally.

## What We Should Not Do Yet

- Do not add payment before we can track activation and sharing.
- Do not expose Admin publicly with only `admin/admin123`.
- Do not connect LINE before CORS, events, and fallback behavior are stable.
- Do not rewrite the whole frontend at once.
- Do not let image generation or visual polish outrun product measurement.

## Working Principle

We build in small, verifiable loops:

```text
Design change
-> deployable implementation
-> measurable event
-> Admin visibility
-> next decision
```

This is the operating rhythm for the project.
