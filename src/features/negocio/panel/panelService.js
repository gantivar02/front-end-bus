import negocioApi from "../../../services/negocioApi";

export async function getDashboard() {
  const { data } = await negocioApi.get("/panel/dashboard");
  return data;
}
