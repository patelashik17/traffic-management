import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const api = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const response = await axios.request<T>({
      url: `${API_URL}${path}`,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(new Headers(options.headers).entries()),
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "API request failed");
    }

    throw error;
  }
};
