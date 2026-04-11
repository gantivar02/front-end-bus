export function getEntityId(entity) {
  if (!entity) {
    return "";
  }

  if (typeof entity.id === "string" && entity.id) {
    return entity.id;
  }

  if (typeof entity._id === "string" && entity._id) {
    return entity._id;
  }

  if (entity._id?.$oid) {
    return entity._id.$oid;
  }

  return "";
}

export function getPermissionData(value) {
  return value?.permission || value || {};
}

export function getPermissionId(value) {
  const permission = getPermissionData(value);

  return (
    value?.permissionId ||
    value?.idPermission ||
    value?.id_permission ||
    getEntityId(permission) ||
    ""
  );
}

export function getPermissionName(permission) {
  return (
    permission?.name ||
    [permission?.module, permission?.action].filter(Boolean).join("_") ||
    "permiso_sin_nombre"
  );
}

export function getPermissionModule(permission) {
  return permission?.module || "general";
}

export function getPermissionAction(permission) {
  return permission?.action || "custom";
}

export function getPermissionDescription(permission) {
  return permission?.description || "Sin descripcion registrada.";
}

export function getPermissionMethod(permission) {
  return String(permission?.method || "").toUpperCase() || "GET";
}

export function getPermissionUrl(permission) {
  return permission?.url || "/";
}

export function formatPermissionLabel(value) {
  const normalized = String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!normalized) {
    return "Sin dato";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function matchesPermissionSearch(permission, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    getPermissionName(permission),
    getPermissionModule(permission),
    getPermissionAction(permission),
    getPermissionDescription(permission),
    getPermissionMethod(permission),
    getPermissionUrl(permission),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

export function groupPermissionsByModule(permissions) {
  const grouped = permissions.reduce((accumulator, permission) => {
    const moduleName = getPermissionModule(permission);

    if (!accumulator[moduleName]) {
      accumulator[moduleName] = [];
    }

    accumulator[moduleName].push(permission);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .sort(([moduleA], [moduleB]) => moduleA.localeCompare(moduleB))
    .map(([moduleName, items]) => ({
      moduleName,
      items: [...items].sort((permissionA, permissionB) =>
        getPermissionName(permissionA).localeCompare(
          getPermissionName(permissionB)
        )
      ),
    }));
}
