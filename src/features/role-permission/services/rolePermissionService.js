import api from "../../../services/api";

export async function getPermissionsByRole(roleId) {
  const response = await api.get(`/role-permission/role/${roleId}`);
  return response.data;
}

export async function assignPermissionToRole(roleId, permissionId) {
  const response = await api.post(
    `/role-permission/${roleId}/permission/${permissionId}`
  );
  return response.data;
}

export async function removeRolePermission(rolePermissionId) {
  const response = await api.delete(`/role-permission/${rolePermissionId}`);
  return response.data;
}