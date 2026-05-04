Good — now we’re finally doing this properly.
You gave the **DB schema**, which is useful, but I’ll correct one thing first:

> ❌ We do NOT design frontend from database
> ✔ We design from **Use Cases → Entities → Ports**

The DB only **informs**, it does NOT define architecture.

---

# 🧠 STEP 1 — FINALIZE USE CASES (CLEAN, COMPLETE, NO GUESSING)

You already partially identified them. I’ll now formalize them properly in **Uncle Bob format**.

---

# ⚙️ 🔵 CORE USE CASES (ONBOARDING ENTRY + EXECUTION)

---

## 1. **RegisterUser**

### 📘 Intent

> Create a new user in the system

### Input

* name
* email
* password

### Output

* userId

---

## 2. **SelectOnboardingPath**

### 📘 Intent

> Assign a role to the user and initiate onboarding for that role

---

### Input

* userId
* roleType (donor | volunteer | beneficiary | etc.)

---

### Output

* userRoleId
* flowId
* currentStep

---

### Responsibilities

* validate role exists
* create user_role
* resolve default template for role
* trigger StartFlow

---

---

## 3. **StartFlow**

### 📘 Intent

> Initialize onboarding flow for a user-role using a template

---

### Input

* userRoleId
* templateId

---

### Output

* flow
* currentStep

---

### Responsibilities

* validate template
* fetch steps
* pick first step
* create flow
* set current_step

---

---

## 4. **SubmitStep**

### 📘 Intent

> Process submitted step data and move workflow forward

---

### Input

* flowId
* stepId
* data

---

### Output

* nextStep OR completion

---

### Responsibilities

* validate current step
* validate input schema (important)
* save step data
* determine next step
* update flow state
* complete flow if needed

---

---

## 5. **GetCurrentFlowState**

### 📘 Intent

> Retrieve current onboarding state for rendering UI

---

### Input

* flowId

---

### Output

* flow
* currentStep
* stepData (if exists)

---

---

# 🧠 That’s your COMPLETE Use Case layer

No guessing needed anymore.

---

# 🟢 STEP 2 — ENTITIES (BASED ON YOUR SYSTEM, NOT DB TABLES)

Now we define **clean Entities (NOT DB models)**

---

## 1. **User**

Core identity.

Fields:

* id
* email
* status
* isBlocked

Rules:

* cannot act if blocked
* email must be unique (enforced elsewhere)

---

---

## 2. **Role**

Fields:

* id
* name

---

---

## 3. **UserRole**

Fields:

* id
* userId
* roleId
* isActive

Rules:

* only one active onboarding flow allowed (important!)

---

---

## 4. **Template**

Fields:

* id
* roleId
* steps[]
* requiresApproval

Rules:

* must have ordered steps
* only one default per role

---

---

## 5. **Step**

Fields:

* id
* stepKey
* order
* isRequired
* inputSchema

Rules:

* order must be unique per template
* validation must respect schema

---

---

## 6. **Flow**

🔥 MOST IMPORTANT ENTITY

Fields:

* id
* userRoleId
* templateId
* currentStepId
* status

---

### Rules:

* only ONE active flow per userRole
* cannot move after COMPLETED
* step must belong to template
* state transitions must be valid

(you already enforce this in DB triggers 👍)

---

---

## 7. **StepData**

Fields:

* flowId
* stepId
* data
* status

Rules:

* must belong to flow
* cannot skip required steps

---

---

## 8. **Approval (Optional for later)**

Not needed for initial frontend, but exists.

---

# 🔌 STEP 3 — PORTS (INTERFACES)

Now define what Use Cases depend on.

---

## REQUIRED PORTS

### UserRepository

* createUser()
* getUserById()

---

### RoleRepository

* getRoleByName()
* getRoleById()

---

### UserRoleRepository

* assignRole()
* getUserRole()

---

### TemplateRepository

* getDefaultTemplateByRole()
* getTemplateWithSteps()

---

### FlowRepository

* createFlow()
* getFlow()
* updateFlow()

---

### StepRepository

* saveStepData()
* getStepData()
* getNextStep()

---

---

# ⚠️ THESE ARE INTERFACES ONLY

No HTTP, no DB here.

---

# 🧭 STEP 4 — EXECUTION FLOW (FINALIZED)

Now your system behavior is crystal clear:

---

## 🧩 FLOW 1 — USER ONBOARDING ENTRY

```text id="2t4dqa"
User registers
   ↓
SelectOnboardingPath
   ↓
Assign role
   ↓
Get template
   ↓
StartFlow
   ↓
Return first step
```

---

## 🧩 FLOW 2 — STEP SUBMISSION

```text id="0p1z0z"
User submits step
   ↓
SubmitStep
   ↓
Validate
   ↓
Save data
   ↓
Next step?
   ↓
YES → return next step
NO → complete flow
```

---

# 🎨 STEP 5 — NOW (AND ONLY NOW) UI

Now UI becomes simple:

---

## Screen 1:

Register

## Screen 2:

Select Role

## Screen 3:

Dynamic Step Renderer

---

## UI DOES:

* call Use Case
* render currentStep

---

## UI DOES NOT:

❌ decide next step
❌ validate business rules
❌ manage workflow

---

# 🔥 FINAL REALITY CHECK

You are now:

✅ Following Uncle Bob correctly
✅ Not guessing architecture
✅ Not mixing layers

---

# 🚀 NEXT STEP (IMPORTANT)

Now that everything is defined, we can move to:

👉 **Interface Adapters (Flutter layer):**

* how Riverpod/Bloc will call Use Cases
* how state flows back to UI

OR

👉 **Dynamic Step UI design (VERY important for your system)**

---

Say:

**“next: adapters”**
or
**“next: UI rendering system”**

and we proceed without breaking architecture.
