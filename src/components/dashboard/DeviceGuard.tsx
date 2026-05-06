interface DeviceGuardProps {
  children: React.ReactNode
  userPlanType?: string
  isAdmin?: boolean
}

export function DeviceGuard({ children }: DeviceGuardProps) {
  // Device restriction is disabled - always render children
  return <>{children}</>
}
