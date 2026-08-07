"use client";

import { ExceptionDashboard } from "@/components/rescueloop/internal/exception-dashboard";
import {
  DEMO_EXCEPTION_SUMMARY,
  DEMO_EXCEPTIONS,
  DEMO_AUDIT_LOG,
} from "@/lib/demo-operations-data";

export default function InternalOperationsPage() {
  return (
    <ExceptionDashboard
      summary={DEMO_EXCEPTION_SUMMARY}
      exceptions={DEMO_EXCEPTIONS}
      auditLog={DEMO_AUDIT_LOG}
    />
  );
}
