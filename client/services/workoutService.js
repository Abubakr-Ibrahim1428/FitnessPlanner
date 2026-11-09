const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, token, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Workout request failed');
  return data;
}

export function getWorkouts(token) {
  return request('/workouts', token);
}

export function createWorkout(token, workout) {
  return request('/workouts', token, {
    method: 'POST',
    body: JSON.stringify(workout),
  });
}

export function updateWorkout(token, id, changes) {
  return request(`/workouts/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function removeWorkout(token, id) {
  return request(`/workouts/${id}`, token, { method: 'DELETE' });
}
