export default function authHeader(): { 'x-access-token': string } | undefined {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user && user.accessToken) {
    return { 'x-access-token': user.accessToken };
  } else {
    return undefined;
  }
}