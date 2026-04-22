import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  clearStoredAdminToken,
  createAdminBillingCheckout,
  fetchAdminInvoices,
  fetchAdminOverview,
  getStoredAdminToken,
  loginAdmin,
  setStoredAdminToken,
} from "../lib/api";
import type { AdminBillingCheckoutResponse, AdminInvoice, AdminInvoiceListResponse, AdminOverviewResponse } from "../lib/types";

type Filters = {
...
          <header className="admin-topbar">
            <div>
              <span className="admin-eyebrow">Reqst Admin</span>
              <h1>Revenue Command Center</h1>
              <p>
                All sales, all statuses, all the live movement in one black dashboard.
              </p>
            </div>
            <div className="admin-topbar-actions">
              <div className="admin-generated-at">
                <span>Last snapshot</span>
                <strong>{overview ? formatDateTime(overview.generated_at) : "Loading..."}</strong>
              </div>
              <Link to="/admin/blog" className="admin-ghost-button">
                Управление блогом
              </Link>
              <button type="button" className="admin-ghost-button" onClick={() => token && void loadOverview(token)}>
                Refresh
              </button>
              <button type="button" className="admin-ghost-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>
...