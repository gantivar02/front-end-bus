import api from "../../../services/api";

export async function getProfiles() {
  const response = await api.get("/profiles");
  return response.data;
}

export async function createProfile(data) {
  const response = await api.post("/profiles", data);
  return response.data;
}

export async function updateProfile(id, data) {
  const response = await api.put(`/profiles/${id}`, data);
  return response.data;
}

export async function deleteProfile(id) {
  const response = await api.delete(`/profiles/${id}`);
  return response.data;
}