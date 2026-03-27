import api from "../../../services/api";

export async function getSessions() {
  const response = await api.get("/sessions");
  return response.data;
}

export async function deleteSession(id) {
  const response = await api.delete(`/sessions/${id}`);
  return response.data;
}