import request from "./api.js";

const AUTH_TOKEN_KEY = "smartspend-demo-token";
const AUTH_USER_KEY = "smartspend-demo-user";

function saveToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function saveUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function removeUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export async function registerUser({ name, email, password }) {
  try {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (data.token && data.user) {
      saveToken(data.token);
      saveUser(data.user);
      return { user: data.user };
    }

    return { error: "Đăng ký không thành công." };
  } catch (error) {
    return { error: error.message };
  }
}

export async function loginUser(email, password) {
  try {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token && data.user) {
      const user = { ...data.user, transactions: data.user.transactions || [] };
      saveToken(data.token);
      saveUser(user);
      return { user };
    }

    return { error: "Đăng nhập không thành công." };
  } catch (error) {
    return { error: error.message };
  }
}

export async function addTransaction(transactionData) {
  try {
    const data = await request("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });

    const user = getCurrentUser();
    if (!user) {
      return { error: "Người dùng chưa đăng nhập." };
    }

    const nextUser = {
      ...user,
      transactions: [data, ...(user.transactions || [])],
    };
    saveUser(nextUser);
    return { user: nextUser };
  } catch (error) {
    return { error: error.message };
  }
}

export function logout() {
  removeToken();
  removeUser();
}
