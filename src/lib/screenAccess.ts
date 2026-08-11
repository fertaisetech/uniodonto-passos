export type ScreenKey = "visaoGeral" | "dashboard" | "relatorios" | "envio" | "configuracoes" | "comunicacoes" | "appVendas" | "crm";

const ROLE_SCREENS_KEY = "uniodonto-role-screens";

const defaultRoleScreens: Record<string, Record<ScreenKey, boolean>> = {
  Administrador: { visaoGeral: true, dashboard: true, relatorios: true, envio: true, configuracoes: true, comunicacoes: true, appVendas: true, crm: true },
  "Tech FerTaise": { visaoGeral: true, dashboard: true, relatorios: true, envio: true, configuracoes: true, comunicacoes: true, appVendas: true, crm: true },
  Diretor: { visaoGeral: true, dashboard: true, relatorios: true, envio: false, configuracoes: false, comunicacoes: false, appVendas: false, crm: false },
  Gerente: { visaoGeral: true, dashboard: true, relatorios: true, envio: false, configuracoes: false, comunicacoes: false, appVendas: false, crm: false },
  "Recepção": { visaoGeral: true, dashboard: true, relatorios: false, envio: false, configuracoes: false, comunicacoes: true, appVendas: false, crm: true },
  Vendedoras: { visaoGeral: true, dashboard: true, relatorios: false, envio: false, configuracoes: false, comunicacoes: true, appVendas: true, crm: true },
  Operador: { visaoGeral: true, dashboard: true, relatorios: false, envio: false, configuracoes: false, comunicacoes: false, appVendas: false, crm: false },
};

export function getRoleScreenPermissions(role?: string): Record<string, boolean> | null {
  try {
    const saved = JSON.parse(localStorage.getItem(ROLE_SCREENS_KEY) || "{}");
    return role && saved?.[role] ? saved[role] : null;
  } catch {
    return null;
  }
}

export function canAccessScreen(
  role: string | undefined,
  screen: ScreenKey,
  individualPermissions?: Partial<Record<ScreenKey, boolean>>,
): boolean {
  if (!role) return false;
  if (typeof individualPermissions?.[screen] === "boolean") {
    return individualPermissions[screen] === true;
  }
  const permissions = getRoleScreenPermissions(role) || defaultRoleScreens[role];
  return permissions?.[screen] === true;
}
