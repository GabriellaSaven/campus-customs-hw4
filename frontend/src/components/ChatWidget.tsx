import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchChatHistory, sendChat } from "../api";
import { useAuth } from "../auth";
import { useMatches } from "../matches";
import { HandsomeDan } from "./YaleArt";
import type { ChatMessage } from "../types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Woof woof! I'm Handsome Dan — think of me as your pal behind the counter. " +
    "Fetch you a hoodie? Sniff out a size? Ask away and I'll dig something up.",
};

// Pull the product id out of a /products/:id path so the agent gets page context.
function productIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/products\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { setMatches } = useMatches();
  const { user, token } = useAuth();
  const location = useLocation();

  // When a user signs in, reload their saved chat history; on logout, reset.
  useEffect(() => {
    if (!user || !token) {
      setMessages([GREETING]);
      return;
    }
    fetchChatHistory(token)
      .then((turns) => {
        if (turns.length === 0) {
          setMessages([
            {
              role: "assistant",
              content: `Woof woof — welcome back, ${user.first_name || user.name}! Good to see you on campus again. What are we hunting for today?`,
            },
          ]);
        } else {
          setMessages(
            turns.map((t) => ({
              role: t.role,
              content: t.content,
              products: t.products,
            })),
          );
        }
      })
      .catch(() => setMessages([GREETING]));
  }, [user, token]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await sendChat(text, {
        productId: productIdFromPath(location.pathname),
        token,
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, products: res.products },
      ]);
      // Push the agent's structured matches onto the page as product cards.
      if (res.products.length > 0) {
        setMatches(res.products, text);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the store right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        className="chat-fab"
        onClick={() => setOpen(true)}
        aria-label="Chat with Handsome Dan"
      >
        <span className="chat-fab-dan">
          <HandsomeDan size={44} />
        </span>
        <span className="chat-fab-bubble">
          Chat with Handsome Dan
          <span className="dot" />
        </span>
      </button>
    );
  }

  return (
    <div className="chat-panel" role="dialog" aria-label="Campus Customs chat">
      <div className="chat-head">
        <div className="avatar">
          <HandsomeDan size={34} />
        </div>
        <div className="who">
          <strong>Handsome Dan</strong>
          <span>Campus Customs assistant</span>
        </div>
        <button className="chat-close" aria-label="Close chat" onClick={() => setOpen(false)}>
          ×
        </button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
            {m.products && m.products.length > 0 && (
              <div className="chat-products">
                {m.products.map((p) => (
                  <Link
                    key={p.product_id}
                    to={`/products/${p.product_id}`}
                    className="chat-prod"
                    onClick={() => setOpen(false)}
                  >
                    <img src={p.image_url} alt={p.name} />
                    <div>
                      <div className="n">{p.name}</div>
                      <div className="p">${p.price.toFixed(0)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <div className="chat-typing">Handsome Dan is typing…</div>}
      </div>

      <form className="chat-foot" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What are you looking for?"
          aria-label="Message"
        />
        <button className="chat-send" type="submit" disabled={sending || !input.trim()}>
          ↑
        </button>
      </form>
    </div>
  );
}
