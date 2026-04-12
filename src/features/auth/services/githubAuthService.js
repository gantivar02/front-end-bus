import api from "../../../services/api";

export async function unlinkGithub() {
  const response = await api.put("/profiles/github/unlink");
  return response.data;
}
