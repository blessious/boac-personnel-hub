import { createFileRoute } from "@tanstack/react-router";
import { EmployeeProfileHome } from "@/routes/self-service";

export const Route = createFileRoute("/my-profile")({
  component: EmployeeProfileHome,
});
