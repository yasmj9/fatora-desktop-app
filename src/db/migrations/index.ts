import { Migration } from "../types";
import { migration001 } from "./001_initial_infrastructure";
import { migration002 } from "./002_company_settings";
import { migration003 } from "./003_services";
import { migration004 } from "./004_clients";
import { migration005 } from "./005_invoices";

/**
 * All registered database migrations in sequential order.
 */
export const MIGRATIONS: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
];



