import api from "../../../services/api";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function createUser(userData) {
  const response = await api.post("/users", userData);
  return response.data;
}

export async function updateUser(id, userData) {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}