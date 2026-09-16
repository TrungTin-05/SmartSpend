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

export async function requestPasswordReset(email) {
  try {
    return await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    return { error: error.message };
  }
}

export async function resetPassword(token, password) {
  try {
    return await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
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

export async function updateTransaction(transactionId, transactionData) {
  try {
    const data = await request(`/api/transactions/${transactionId}`, {
      method: "PUT",
      body: JSON.stringify(transactionData),
    });

    const user = getCurrentUser();
    if (!user) {
      return { error: "Người dùng chưa đăng nhập." };
    }

    const nextUser = {
      ...user,
      transactions: (user.transactions || []).map((transaction) =>
        transaction.id === data.id ? data : transaction
      ),
    };
    saveUser(nextUser);
    return { user: nextUser };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteTransaction(transactionId) {
  try {
    await request(`/api/transactions/${transactionId}`, {
      method: "DELETE",
    });

    const user = getCurrentUser();
    if (!user) {
      return { error: "Người dùng chưa đăng nhập." };
    }

    const nextUser = {
      ...user,
      transactions: (user.transactions || []).filter(
        (transaction) => transaction.id !== transactionId
      ),
    };
    saveUser(nextUser);
    return { user: nextUser };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getCategories(type = "expense") {
  try {
    return { categories: await request(`/api/categories?type=${type}`) };
  } catch (error) {
    return { error: error.message };
  }
}

export async function addCategory(name, type = "expense") {
  try {
    return { category: await request("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, type }),
    }) };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateCategory(categoryId, name) {
  try {
    return { category: await request(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }) };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteCategory(categoryId) {
  try {
    await request(`/api/categories/${categoryId}`, { method: "DELETE" });
    return {};
  } catch (error) {
    return { error: error.message };
  }
}

export function logout() {
  removeToken();
  removeUser();
}
