import type { ChatMessage, Product, User } from "./types";

// Requests go through the Vite dev proxy to the FastAPI backend (see vite.config.ts).
async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Surface the backend's error message (e.g. "Incorrect email or password.")
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore non-JSON bodies */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export async function fetchProducts(): Promise<Product[]> {
  return asJson<Product[]>(await fetch("/api/products"));
}

export async function fetchProduct(id: string): Promise<Product> {
  return asJson<Product>(await fetch(`/api/products/${encodeURIComponent(id)}`));
}

export async function fetchRelated(id: string): Promise<Product[]> {
  return asJson<Product[]>(
    await fetch(`/api/products/${encodeURIComponent(id)}/related`),
  );
}

export interface OrderItem {
  product_id: string;
  name: string;
  image_url: string;
  size: string;
  quantity: number;
  unit_price: number;
  ordered_at: string;
}

export async function fetchOrders(token: string): Promise<OrderItem[]> {
  return asJson<OrderItem[]>(
    await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } }),
  );
}

// Records a genuine purchase for the signed-in shopper.
export async function placeOrder(
  token: string,
  data: { product_id: string; size: string; quantity?: number },
): Promise<OrderItem> {
  return asJson<OrderItem>(
    await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: 1, ...data }),
    }),
  );
}

// ---------------------------------------------------------------- accounts
export interface AuthResponse {
  token: string;
  user: User;
}

export async function signup(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return asJson<AuthResponse>(
    await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return asJson<AuthResponse>(
    await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function fetchMe(token: string): Promise<User> {
  return asJson<User>(
    await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
  );
}

export interface ChatReply {
  reply: string;
  products: Product[];
}

// Sends a shopper message to the Blue agent (PydanticAI behind FastAPI) and returns
// its reply plus any products the agent surfaced, so the widget can show them.
// Passes the current product page (if any) so "do you have this in pink?" resolves,
// and the auth token (if signed in) so history is remembered and saved.
export interface ChatOptions {
  productId?: string | null;
  token?: string | null;
}

export async function sendChat(
  message: string,
  opts: ChatOptions = {},
): Promise<ChatReply> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  return asJson<ChatReply>(
    await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        page: opts.productId ? { product_id: opts.productId } : null,
      }),
    }),
  );
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  products: Product[];
}

// Loads the signed-in user's saved transcript so the widget can reload the chat.
export async function fetchChatHistory(token: string): Promise<ChatTurn[]> {
  return asJson<ChatTurn[]>(
    await fetch("/api/chat/history", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export type { ChatMessage };
