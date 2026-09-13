import { Migration } from "../types";
import { migration001 } from "./001_initial_infrastructure";
import { migration002 } from "./002_company_settings";
import { migration003 } from "./003_services";
import { migration004 } from "./004_clients";
import { migration005 } from "./005_invoices";
import { migration006 } from "./006_logos";
import { migration007 } from "./007_invoice_styles";
import { migration008 } from "./008_quotations";
import { migration009 } from "./009_invoice_style_customization";
import { migration010 } from "./010_invoice_style_due_date";
import { migration011 } from "./011_company_invoice_pattern";

/**
 * All registered database migrations in sequential order.
 */
export const MIGRATIONS: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
];



