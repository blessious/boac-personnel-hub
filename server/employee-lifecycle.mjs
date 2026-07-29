export function employeeLifecycleTransition(previousStatus, nextStatus) {
  if (previousStatus === "Inactive" && nextStatus === "Active") {
    return { lifecycleState: "Active", accountActive: 1 };
  }
  if (previousStatus === "Active" && nextStatus === "Inactive") {
    return { lifecycleState: "Inactive", accountActive: 0 };
  }
  return null;
}
