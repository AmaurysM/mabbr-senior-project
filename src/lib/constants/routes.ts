export const PROTECTED_ROUTES = [
  , "/profile"
  , "/dashboard"
  , "/settings"
  , "/achievements"
  , "/bond"
  , "edit-profile"
  , "lootbox"
  , "note"
  , "portfolio"
  , "profile"
  , "trade"
];

// Routes that should only be accessible when not authenticated.
export const ONLY_UNAUTHENTICATED_ROUTES = [
  "/login-signup",
];

// Default route to redirect to when an unauthenticated user tries to access a protected route.
export const DEFAULT_UNAUTHENTICATED_REDIRECT = "/login-signup";

// Default route to redirect to when an authenticated user tries to access a route meant for unauthenticated users.
export const DEFAULT_LOGIN_REDIRECT = "/profile";