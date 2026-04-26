"use client";

import "./marketing/plans/plans.css";
import { PlanMerchant } from "./marketing/plans/PlanMerchant";
import { PlanDeveloper } from "./marketing/plans/PlanDeveloper";
import { PlanBusiness } from "./marketing/plans/PlanBusiness";
import { PlanEnterprise } from "./marketing/plans/PlanEnterprise";

export type Variant = "merchant" | "developer" | "business" | "enterprise";

export function PlanPage({ variant }: { variant: Variant }) {
  switch (variant) {
    case "merchant":
      return <PlanMerchant />;
    case "developer":
      return <PlanDeveloper />;
    case "business":
      return <PlanBusiness />;
    case "enterprise":
      return <PlanEnterprise />;
    default:
      return null;
  }
}
