/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agents_autoCaptureAgent from "../agents/autoCaptureAgent.js";
import type * as agents_autoCaptureQueries from "../agents/autoCaptureQueries.js";
import type * as agents_coordinatorAgent from "../agents/coordinatorAgent.js";
import type * as agents_frameProcessor from "../agents/frameProcessor.js";
import type * as agents_memory from "../agents/memory.js";
import type * as agents_ragAgent from "../agents/ragAgent.js";
import type * as agents_ragQueries from "../agents/ragQueries.js";
import type * as agents_reactAgent from "../agents/reactAgent.js";
import type * as agents_reactMutations from "../agents/reactMutations.js";
import type * as agents_supervisorAgent from "../agents/supervisorAgent.js";
import type * as agents_visionAgent from "../agents/visionAgent.js";
import type * as agents_voiceAgent from "../agents/voiceAgent.js";
import type * as auth from "../auth.js";
import type * as cameras from "../cameras.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as router from "../router.js";
import type * as technicians from "../technicians.js";
import type * as tickets from "../tickets.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "agents/autoCaptureAgent": typeof agents_autoCaptureAgent;
  "agents/autoCaptureQueries": typeof agents_autoCaptureQueries;
  "agents/coordinatorAgent": typeof agents_coordinatorAgent;
  "agents/frameProcessor": typeof agents_frameProcessor;
  "agents/memory": typeof agents_memory;
  "agents/ragAgent": typeof agents_ragAgent;
  "agents/ragQueries": typeof agents_ragQueries;
  "agents/reactAgent": typeof agents_reactAgent;
  "agents/reactMutations": typeof agents_reactMutations;
  "agents/supervisorAgent": typeof agents_supervisorAgent;
  "agents/visionAgent": typeof agents_visionAgent;
  "agents/voiceAgent": typeof agents_voiceAgent;
  auth: typeof auth;
  cameras: typeof cameras;
  crons: typeof crons;
  documents: typeof documents;
  http: typeof http;
  router: typeof router;
  technicians: typeof technicians;
  tickets: typeof tickets;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
