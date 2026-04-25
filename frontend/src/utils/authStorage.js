const AUTH_TOKEN_KEY = "token";

const getToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
};

const setToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth-updated"));
};

const clearToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event("auth-updated"));
};

const hasToken = () => Boolean(getToken());

export { AUTH_TOKEN_KEY, getToken, setToken, clearToken, hasToken };
