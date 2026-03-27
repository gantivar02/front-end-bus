import api from "../../../services/api";

export async function getRoles() {
  const response = await api.get("/roles");
  return response.data;
}

export async function createRole(data) {
  const response = await api.post("/roles", data);
  return response.data;
}

export async function updateRole(id, data) {
  const response = await api.put(`/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id) {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
}