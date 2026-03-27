import api from "../../../services/api";

export async function getPermissions() {
  const response = await api.get("/permissions");
  return response.data;
}

export async function createPermission(data) {
  const response = await api.post("/permissions", data);
  return response.data;
}

export async function updatePermission(id, data) {
  const response = await api.put(`/permissions/${id}`, data);
  return response.data;
}

export async function deletePermission(id) {
  const response = await api.delete(`/permissions/${id}`);
  return response.data;
}