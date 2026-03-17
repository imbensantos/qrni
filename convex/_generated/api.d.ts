/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as collaboration from "../collaboration.js";
import type * as http from "../http.js";
import type * as lib_shortCode from "../lib/shortCode.js";
import type * as links from "../links.js";
import type * as namespaces from "../namespaces.js";
import type * as redirects from "../redirects.js";
import type * as safeBrowsing from "../safeBrowsing.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  collaboration: typeof collaboration;
  http: typeof http;
  "lib/shortCode": typeof lib_shortCode;
  links: typeof links;
  namespaces: typeof namespaces;
  redirects: typeof redirects;
  safeBrowsing: typeof safeBrowsing;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
