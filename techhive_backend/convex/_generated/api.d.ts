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
import type * as agenticTickets from "../agenticTickets.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as http from "../http.js";
import type * as issues from "../issues.js";
import type * as nemotron from "../nemotron.js";
import type * as nemotronMutations from "../nemotronMutations.js";
import type * as router from "../router.js";
import type * as videoFeeds from "../videoFeeds.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agenticTickets: typeof agenticTickets;
  ai: typeof ai;
  auth: typeof auth;
  chat: typeof chat;
  http: typeof http;
  issues: typeof issues;
  nemotron: typeof nemotron;
  nemotronMutations: typeof nemotronMutations;
  router: typeof router;
  videoFeeds: typeof videoFeeds;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
