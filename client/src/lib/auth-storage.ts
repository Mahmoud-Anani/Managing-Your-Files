const USER_KEY = "myf.user";

export function getStoredUser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(USER_KEY);
}

export function setStoredUser(userJson: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(USER_KEY, userJson);
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(USER_KEY);
}
