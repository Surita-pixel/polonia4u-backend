# Milestone 1 - Architecture Scaffolding

This document outlines the placeholders and scaffolding implemented for Milestone 1.

## State Machine
- **File**: `modules/stateMachine.ts`
- **Purpose**: Defines the lead → proposal → contract → payment → portal flow
- **Functions**: `getNextStates`, `canTransition`, `transitionState`

## Event System
- **File**: `modules/events.ts`
- **Purpose**: Event-driven architecture with queue and retry logic
- **Features**:
  - Emit events to `events` table
  - Process queued events
  - Retry failed events (max 3 attempts)

## Webhooks
- **File**: `routes/webhooks.ts`
- **Purpose**: Placeholder endpoints for Stripe and Clicksign integrations
- **Endpoints**:
  - `/api/webhooks/stripe` - Payment webhooks
  - `/api/webhooks/clicksign` - Contract signing webhooks

## RLS Policies
- **File**: `policies/RLS.sql`
- **Purpose**: Row Level Security policies for data isolation
- **Policies**: User data access, admin overrides

## Structured Logging
- **File**: `lib/logger.ts`
- **Purpose**: Winston-based logging with structured output
- **Features**: Event logging, error logging, audit trails

## Usage
1. Enable RLS in Supabase and apply `policies/RLS.sql`
2. Set up webhook endpoints in Stripe/Clicksign pointing to `/api/webhooks/*`
3. Use `emitEvent()` in modules to trigger state transitions
4. Monitor logs via Winston output

## Next Steps
- Connect real Stripe/Clicksign APIs
- Implement actual business logic in placeholders
- Add monitoring and alerting