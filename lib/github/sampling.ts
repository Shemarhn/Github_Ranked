import { randomInt } from 'node:crypto';

interface ListedUser {
  id: number;
  login: string;
  type: string;
}

async function github<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  if (!response.ok)
    throw new Error(`Population discovery failed (${response.status})`);
  return response.json() as Promise<T>;
}

/** Random IDs, accepting exact matches only: gaps/deleted accounts get no extra weight. */
export async function discoverSample(
  token: string,
  attempts = 20,
  limit = 5
): Promise<string[]> {
  const latest = await github<{ items: ListedUser[] }>(
    '/search/users?q=type%3Auser&sort=joined&order=desc&per_page=1',
    token
  );
  const maximumId = latest.items[0]?.id;
  if (!Number.isSafeInteger(maximumId) || maximumId < 1 || maximumId >= 2 ** 48)
    throw new Error('Invalid population sampling range');
  const selected = new Set<string>();
  for (
    let attempt = 0;
    attempt < attempts && selected.size < limit;
    attempt++
  ) {
    const id = randomInt(1, maximumId + 1);
    const users = await github<ListedUser[]>(
      `/users?since=${id - 1}&per_page=1`,
      token
    );
    const user = users[0];
    if (user?.id === id && user.type === 'User')
      selected.add(user.login.toLowerCase());
  }
  return [...selected];
}
