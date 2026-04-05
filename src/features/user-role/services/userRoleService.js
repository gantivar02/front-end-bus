import api from "../../../services/api";

export async function getRolesByUser(userId) {
  const response = await api.get(`/user-role/user/${userId}`);
  return response.data;
}

export async function assignRoleToUser(userId, roleId) {
  const response = await api.post(`/user-role/${userId}/role/${roleId}`);
  return response.data;
}

export async function removeUserRole(userRoleId) {
  const response = await api.delete(`/user-role/${userRoleId}`);
  return response.data;
}