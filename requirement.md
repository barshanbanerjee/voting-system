EVM-Style Secure Voting System

Overview

This project is a secure, LAN-based digital voting system inspired by the workflow of Electronic Voting Machines (EVMs).

The system is designed for:

* Universities
* Student unions
* Organizations
* Clubs
* Internal elections
* Committees

The architecture focuses on:

* vote integrity
* controlled voting environment
* admin verification
* transparency
* auditability
* kiosk-based voting terminals
* local-network security

This is NOT an internet voting platform.
The system is designed to run primarily on an isolated local network (LAN).

⸻

Core Concept

The system mimics real-world EVM structure:

Components

1. Control Unit

Managed by admins.

Responsible for:

* election management
* voter verification
* election start/end
* live monitoring
* result publishing

⸻

2. Voting Unit

Dedicated fullscreen voting terminal.

Used by voters to:

* authenticate
* verify identity
* cast votes
* review selections
* submit final vote

⸻

3. Public Statistics Unit

QR-code-based public statistics portal.

Provides:

* turnout stats
* public election analytics
* candidate vote totals

without revealing voter identities.

⸻

Main Goals

* Fully controlled election environment
* LAN-based isolated system
* Fullscreen kiosk voting
* Mouse/touch-only voting
* Immutable vote storage
* Admin approval workflow
* Real-time monitoring
* Transparent audit system
* Public statistical transparency
* Prevention of vote editing/manipulation

⸻

System Roles

Superadmin

Route:

/superadmin

Credentials stored in:

SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
SUPERADMIN_CODE=

Responsibilities:

* create admins
* reset admin passwords
* manage admin roles
* activate/deactivate admins
* system-level audit access

Superadmin should NOT modify votes.

⸻

Admin

Route:

/admin

Responsibilities:

* create campaigns
* create elections
* manage candidates
* import voters
* monitor voting
* generate voter access codes
* approve voter verification
* start/end election
* publish public statistics
* view results

Sensitive actions require:

* password
* admin code
* optional OTP

⸻

Voter

Route:

/vote

Voting terminal used in kiosk/fullscreen mode.

Capabilities:

* enter voter ID
* enter temporary code
* verify identity
* cast votes sequentially
* review selections
* submit final vote

Restrictions:

* no editing after submission
* no keyboard interaction
* fullscreen only
* mouse/touch interaction only

⸻

Election Structure

Campaign

A campaign contains:

* campaign name
* logo
* multiple elections
* voter list
* candidate pool

Example:

2026 Student Election

⸻

Elections Inside Campaign

Each campaign can contain multiple elections.

Example:

President
Secretary
Treasurer

Each election uses candidates selected from the campaign candidate pool.

⸻

Candidate System

Each campaign has a candidate pool.

Candidate details:

* name
* photo
* party/group
* bio
* symbol

Candidates are assigned to elections.

⸻

Voter Management

Admin imports voter data using:

* CSV
* XLSX

Fields:

name
voterId
phone
email
address
verificationCode

Features:

* CRUD management
* bulk import
* duplicate prevention
* voter validation

⸻

Voting Workflow

Step 1 — Generate Voting Session

Admin generates:

* temporary access code
* voting session

Code is written physically on paper.

⸻

Step 2 — Voter Login

Voter enters:

* voter ID
* temporary code

Validation checks:

* voter exists
* election live
* not already voted
* valid session

⸻

Step 3 — Identity Confirmation

Voting terminal displays:

* voter name
* voter ID
* campaign name

Voter confirms identity.

⸻

Step 4 — Admin Verification

Second admin terminal receives live request.

Admin verifies physical voter.

Admin clicks:

Approve

Voting session becomes active.

⸻

Step 5 — Voting

Voter casts votes sequentially.

Example:

President → Secretary → Treasurer

UI should mimic EVM simplicity:

* large buttons
* candidate symbols
* candidate photos
* minimal distractions

⸻

Step 6 — Review Panel

Right-side panel displays:

* election names
* selected candidates

Voter reviews selections.

⸻

Step 7 — Final Submission

On submit:

* votes stored atomically
* voter marked as voted
* immutable vote records created
* audit logs generated
* receipt generated
* session destroyed

Vote becomes non-editable.

⸻

Public Statistics System

Each campaign generates:

* QR code
* public statistics URL

Initially visible:

Votes Cast / Total Voters
Participation Percentage

After admin publishes results:

* candidate totals
* charts
* election statistics
* turnout analytics

Never reveal:

* voter identity
* voter selections publicly

⸻

Security Architecture

Important Principle

Admins must NEVER edit votes.

Allowed:

* view
* monitor
* export
* audit

Not allowed:

* insert
* update
* delete

⸻

Recommended Security Features

Immutable Vote Ledger

Each vote stores:

previousHash
currentHash

This creates blockchain-like tamper detection.

⸻

Transaction-Based Voting

All vote submissions use:

SERIALIZABLE TRANSACTION

Ensures:

* consistency
* no duplicate voting
* atomic submission

⸻

Encryption

Encrypt:

* voter data
* verification codes
* email addresses

Recommended:

AES-256

⸻

Vote Anonymization

Do NOT directly store voter IDs with votes.

Instead use:

voterHash

⸻

Audit Logs

Log every action:

* login
* approvals
* vote start
* vote submit
* election publish
* result access

⸻

Session Lockdown

If:

* admin logs out
* election stops
* connection lost

Then:

Voting immediately stops

⸻

Voting Terminal Security

Goal

Voting terminals should behave like dedicated EVM machines.

⸻

Kiosk Mode

Voting terminals should:

* stay fullscreen
* hide browser UI
* disable navigation
* disable refresh
* disable right-click
* disable shortcuts where possible

Recommended launch:

Windows

chrome.exe --kiosk http://SERVER_IP:3000/vote

Linux

chromium-browser --kiosk http://SERVER_IP:3000/vote

⸻

Keyboard Restrictions

Voting terminals should:

* avoid physical keyboard usage
* support mouse/touch only
* use virtual keyboard for code entry

Recommended library:

react-simple-keyboard

⸻

Electron Kiosk Application (Future Upgrade)

Recommended future implementation:

Electron + Next.js

Advantages:

* stronger fullscreen control
* devtools blocking
* shortcut interception
* navigation prevention
* app-level kiosk mode

⸻

Local Network Architecture

Recommended Setup

Main Server Laptop

Runs:

* Next.js app
* PostgreSQL
* Socket.IO
* Admin panel
* APIs

Acts as:

Control Unit

⸻

Voting Laptops

Dedicated fullscreen terminals.

Acts as:

Voting Units

⸻

Verification Laptop

Optional verification/admin station.

⸻

Network Recommendation

Recommended:

LAN-based isolated network

Architecture:

Server Laptop
    ↓
Router/Switch
    ↓
Voting Terminals

⸻

Internet Usage

Preferred:

NO INTERNET CONNECTION

Router used only for local communication.

Advantages:

* reduced attack surface
* no external access
* safer election environment

⸻

Router Security

Recommended:

* WPA2/WPA3
* disable WPS
* strong router password
* optional MAC filtering
* no WAN/internet access

⸻

Ethernet Alternative

For stronger security:

Ethernet LAN switch

Advantages:

* stable
* no wireless attacks
* lower latency
* physically controlled

⸻

Suggested Tech Stack

Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zustand or Redux

⸻

Backend

* Next.js Route Handlers
* Server Actions
* Socket.IO

⸻

Database

Recommended:

PostgreSQL

Use:

Prisma ORM

⸻

Real-Time Communication

Use:

Socket.IO

Needed for:

* voter verification
* live monitoring
* submission updates
* election synchronization

⸻

Authentication

Recommended:

NextAuth/Auth.js

Features:

* role-based access
* secure sessions
* MFA support

⸻

Charts & Statistics

Use:

Recharts

⸻

QR Code Generation

Use:

qrcode

⸻

File Import

Use:

* xlsx
* csv parser

⸻

Recommended Database Tables

users

id
name
email
password
role
adminCode

⸻

campaigns

id
name
logo
description
status
isPublic

⸻

elections

id
campaignId
name

⸻

candidates

id
campaignId
name
photo
bio
symbol

⸻

voters

id
campaignId
name
voterId
phone
email
address
verificationCode
hasVoted

⸻

vote_sessions

id
voterId
campaignId
status
startedAt
completedAt

⸻

votes

id
campaignId
electionId
candidateId
voterHash
timestamp
previousHash
currentHash

⸻

audit_logs

id
action
performedBy
metadata
timestamp

⸻

Development Phases

Phase 1

Core management system:

* authentication
* roles
* campaigns
* elections
* candidates

⸻

Phase 2

Voter management:

* CSV/XLSX import
* CRUD
* verification workflow

⸻

Phase 3

Voting engine:

* sequential voting
* review panel
* final submission
* transactions

⸻

Phase 4

Real-time system:

* Socket.IO sync
* live admin updates
* approval workflow

⸻

Phase 5

Security layer:

* encryption
* vote hashing
* audit logs
* kiosk restrictions

⸻

Phase 6

Public statistics portal:

* QR system
* public analytics
* result publishing

⸻

Future Enhancements

Possible future features:

* VVPAT-style printable slips
* biometric verification
* face verification
* offline encrypted backups
* blockchain verification
* hardware token verification
* dedicated Linux kiosk OS

⸻

Important Real-World Notes

This system is suitable for:

* universities
* organizations
* clubs
* institutional elections

For government/national elections, additional requirements would exist:

* legal compliance
* independent auditing
* certified hardware
* cryptographic verification standards
* anti-coercion protections

⸻

Final Vision

The goal is to create a secure, transparent, controlled, and auditable digital election system inspired by EVM architecture.

Key priorities:

1. vote integrity
2. voter privacy
3. immutable records
4. admin accountability
5. transparent statistics
6. controlled voting environment
7. real-time monitoring

This project should prioritize:

* security
* reliability
* simplicity
* auditability

above visual complexity.