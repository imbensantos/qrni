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
import type * as cleanup from "../cleanup.js";
import type * as collaboration from "../collaboration.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as lib_linkHelpers from "../lib/linkHelpers.js";
import type * as lib_ogScraper from "../lib/ogScraper.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_shortCode from "../lib/shortCode.js";
import type * as lib_validation from "../lib/validation.js";
import type * as links from "../links.js";
import type * as namespaces from "../namespaces.js";
import type * as ogScraper from "../ogScraper.js";
import type * as redirects from "../redirects.js";
import type * as safeBrowsing from "../safeBrowsing.js";
import type * as users from "../users.js";

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cleanup: typeof cleanup;
  collaboration: typeof collaboration;
  contact: typeof contact;
  crons: typeof crons;
  email: typeof email;
  http: typeof http;
  "lib/auditLog": typeof lib_auditLog;
  "lib/constants": typeof lib_constants;
  "lib/emailTemplates": typeof lib_emailTemplates;
  "lib/linkHelpers": typeof lib_linkHelpers;
  "lib/ogScraper": typeof lib_ogScraper;
  "lib/permissions": typeof lib_permissions;
  "lib/shortCode": typeof lib_shortCode;
  "lib/validation": typeof lib_validation;
  links: typeof links;
  namespaces: typeof namespaces;
  ogScraper: typeof ogScraper;
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
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;

export declare const components: {};
