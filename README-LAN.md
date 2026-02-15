# LAN-Based Secure Voting System — Network & Admin Panel README

## Overview

This document explains:
* LAN-based voting architecture
* device communication flow
* local server setup
* election workflow
* admin panel structure
* voting terminal behavior
* real-time synchronization

The system is inspired by EVM-style election flow.

It is designed for:
* universities
* clubs
* organizations
* committees
* institutional elections

The system is intended to run inside an isolated local network (LAN), without requiring internet.

---

## LAN-Based System Architecture

### Main Idea
One laptop acts as:
**Main Election Server**

Other laptops act as:
* voting terminals
* verification terminals
* admin monitoring systems

All devices communicate through:
**LAN / Router / Local WiFi**
without internet.

---

## Device Setup Example
* **Laptop 1** → Main Server + Main Admin
* **Laptop 2** → Voting Terminal
* **Laptop 3** → Verification Admin

Connected to:
**WiFi Router / LAN Switch**

---

## Router Role
The router only provides:
* local device communication
* local IP assignment
* LAN connectivity

The router does NOT need internet.
**Recommended:** Disconnect WAN/Internet cable. This creates an isolated election environment.

---

## Example LAN IPs
* **Laptop 1 (Server):** 192.168.0.101
* **Laptop 2 (Vote):**   192.168.0.102
* **Laptop 3 (Verify):** 192.168.0.103

---

## Main Server Responsibilities
Laptop 1 runs:
* Next.js application
* PostgreSQL database
* Socket.IO server
* Admin panel
* APIs

Acts as: **Control Unit**

---

## Server Startup
Next.js must be exposed to LAN.

Example:
```bash
next dev -H 0.0.0.0
```
or:
```bash
next start -H 0.0.0.0
```

---

## PostgreSQL Flow
PostgreSQL runs ONLY on:
**Main Server Laptop**

Other laptops never directly connect to the database.

Flow:
`Client → API → Server → PostgreSQL`

This improves security.

---

## Socket.IO Role
Socket.IO handles:
* live voter verification
* election start/end events
* live monitoring
* session synchronization
* vote submission updates
* admin notifications

---

## Voting Terminal Setup
Voting terminals open:
`http://SERVER_IP:3000/vote`

Example:
`http://192.168.0.101:3000/vote`

---

## Kiosk Mode
Voting terminals should run in fullscreen kiosk mode.

Example:
**Windows**
`chrome.exe --kiosk http://192.168.0.101:3000/vote`

**Linux**
`chromium-browser --kiosk http://192.168.0.101:3000/vote`

---

## Voting Terminal Restrictions
Voting terminals should:
* remain fullscreen
* hide browser UI
* disable refresh/navigation
* disable right-click
* use mouse/touch only
* avoid physical keyboard usage
* use virtual keyboard for code input

Recommended virtual keyboard:
`react-simple-keyboard`

---

## Verification Terminal
Verification admin opens:
`/admin/verify`

Responsibilities:
* verify physical voter
* approve voting requests
* monitor live sessions

---

## Election Workflow

### Step 1 — Election Creation
Admin creates:
* campaign
* elections
* candidates
* voter lists

### Step 2 — Election Start
Admin clicks: **START ELECTION**
Backend updates: `campaign.status = LIVE`
Socket.IO broadcasts: `election_live`
All terminals activate.

### Step 3 — Voter Session Generation
Admin generates:
* temporary voting code
* voting session

Code is written physically on paper.

### Step 4 — Voter Login
Voter enters:
* voter ID
* temporary code

System validates:
* voter exists
* session valid
* election live
* not already voted

### Step 5 — Identity Confirmation
Voting terminal displays:
* voter name
* voter ID
* campaign name

Voter confirms identity.

### Step 6 — Verification Approval
Verification admin receives live request.
Admin physically checks voter.
Admin clicks: **APPROVE**
Voting terminal unlocks.

### Step 7 — Voting
Voter:
* selects candidates
* votes election-by-election
* reviews selections
* submits final vote

### Step 8 — Vote Submission
Votes are:
* stored atomically
* transaction protected
* immutable after submission

System:
* marks voter as voted
* generates audit logs
* destroys session

### Step 9 — Election End
Admin clicks: **END ELECTION**
Backend updates: `campaign.status = ENDED`
All terminals immediately lock.

### Step 10 — Public Result Publishing
Admin verifies using:
* password
* adminCode
* optional OTP

Then publishes:
* public statistics
* candidate totals
* turnout analytics

---

## Admin Panel Structure

### Main Admin Routes
* `/admin`
* `/admin/campaigns`
* `/admin/elections`
* `/admin/candidates`
* `/admin/voters`
* `/admin/live`
* `/admin/results`
* `/admin/settings`
* `/admin/audit`
* `/admin/verify`

### Admin Dashboard
**Purpose:** Central election control center.

**Widgets:**
* active campaign
* live voter count
* total turnout
* active voting sessions
* pending approvals
* recent activity
* election status
* quick actions

**Quick actions:**
* start election
* end election
* generate session
* publish results

### Campaign Management
**Features:**
* create campaign
* edit campaign
* upload logo
* set description
* activate/deactivate campaign
* archive campaign
* assign elections
* assign voters

**Campaign settings:**
* public/private results
* voting duration
* mock poll enabled
* QR statistics enabled

### Election Management
**Features:**
* create elections
* edit elections
* delete elections
* reorder elections
* assign candidates
* configure vote type

**Example elections:**
President, Secretary, Treasurer

### Candidate Management
**Features:**
* add candidate
* upload photo
* assign symbol
* add party/group
* edit bio
* assign to elections
* activate/deactivate candidate

**Candidate fields:**
name, photo, symbol, party, bio

### Voter Management
**Features:**
* CSV/XLSX import
* manual voter add
* edit voter
* delete voter
* search voter
* bulk actions
* duplicate prevention
* export voters

**Voter fields:**
name, voterId, phone, email, address, verificationCode

### Session Management
**Features:**
* generate temporary voting code
* activate session
* cancel session
* regenerate session
* monitor active sessions
* auto-expire sessions

**Session states:**
pending, active, submitted, cancelled, expired

### Live Monitoring Panel
**Purpose:** Real-time election monitoring.

**Features:**
* currently voting voters
* pending verification
* completed votes
* turnout percentage
* active terminals
* election timer
* suspicious activity alerts
* live logs

Powered by: **Socket.IO**

### Verification Panel
**Route:** `/admin/verify`

**Features:**
* approve voter
* reject voter
* verify physical identity
* view live requests
* session approval logs

### Result Panel
**Protected by:** password, adminCode, optional OTP

**Features:**
* candidate totals
* turnout analytics
* election-wise results
* graphs/charts
* export reports
* audit verification

**Restrictions:**
* NO vote editing
* NO deletion
* NO insertion
Admin can only VIEW results.

### Public Statistics Management
**Features:**
* generate QR code
* control public visibility
* publish results
* hide/unhide statistics

**Before publishing:** Only turnout visible
**After publishing:** candidate totals, analytics, charts, election statistics

### Audit Log Panel
Tracks every action.

**Logs:** logins, approvals, vote submissions, election changes, result publication, suspicious activities
**Fields:** user, action, ip, device, timestamp, metadata

### Settings Panel
**Features:** election configuration, kiosk settings, LAN settings, admin management, session timeout, OTP configuration, email configuration, QR settings, security policies

---

## Security Principles

### Important Rules
Admins must NEVER:
* modify votes
* delete votes
* insert votes

Votes must remain immutable.

### Security Features
Recommended:
* transaction-based voting
* immutable vote ledger
* vote hashing
* AES-256 encryption
* audit logs
* role-based access
* session locking
* isolated LAN
* kiosk mode terminals

---

## Recommended Tech Stack
**Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui
**Backend:** Next.js Route Handlers, Socket.IO
**Database:** PostgreSQL, Prisma ORM
**Real-time:** Socket.IO
**Authentication:** NextAuth/Auth.js

---

## Final Goal
The system should behave like a controlled digital EVM ecosystem:
* isolated
* auditable
* secure
* monitored
* transparent
* immutable

with strong emphasis on:
1. vote integrity
2. voter privacy
3. admin accountability
4. controlled environment
5. real-time monitoring
6. transparency without exposing identities
