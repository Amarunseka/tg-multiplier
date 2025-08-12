import { http } from "./httpClient";

export type UserStats = {
  userName: string;
  today: {
    total: number;
    correct: number;
    wrong: number;
    grade: string; // Итоговая оценка готовит бэк
  };
  assignment: {
    targetCorrect: number;   // Сколько надо набрать сегодня
    achievedCorrect: number; // Сколько уже набрано
  };
};

// Может вернуть 200 с JSON или 204 (новый пользователь)
export async function fetchUser() {
  return http<UserStats | undefined>("/api/user", {
    method: "GET",
    allowNoContent: true,
  });
}

// Сохраняем имя пользователя
export async function saveUserName(name: string) {
  return http<void>("/api/user", {
    method: "POST",
    body: JSON.stringify({ name }),
    // обычно 200/204 без тела
    allowNoContent: true,
  });
}