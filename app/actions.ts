"use server";

export async function updateDbItem(id: string) {
  return { myid: id };
}

import { createAI, getAIState, getMutableAIState, streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { ReactNode } from "react";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

export async function getChat(): Promise<ServerMessage[]> {
  return [
    {
      role: "user",
      content: "Hello! Can you help me with a math problem?",
    },
    {
      role: "assistant",
      content: "Of course! What math problem are you working on?",
    },
    {
      role: "user",
      content: "I'm trying to solve this equation: 2x + 3 = 11. How do I find x?",
    },
    {
      role: "assistant",
      content: "To solve the equation 2x + 3 = 11, you need to isolate x. First, subtract 3 from both sides: 2x = 8. Then, divide both sides by 2: x = 4.",
    },
    {
      role: "user",
      content: "Got it, thanks! Can you also help me with another problem?",
    },
    {
      role: "assistant",
      content: "Sure! What’s the next problem?",
    },
    {
      role: "user",
      content: "I need to find the derivative of the function f(x) = 3x^2 + 2x + 1.",
    },
    {
      role: "assistant",
      content: "To find the derivative of f(x) = 3x^2 + 2x + 1, apply the power rule to each term: f'(x) = 6x + 2.",
    },
  ];
}

function saveChat(history: ServerMessage[]) {
  console.log("saving chat history", history);
}

export async function continueConversation(input: string): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const result = await streamUI({
    model: openai("gpt-3.5-turbo"),
    messages: [...history.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [...messages, { role: "user", content: input }, { role: "assistant", content }]);
      }

      return content;
    },
  });

  return {
    id: Math.random().toString(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      saveChat(state);
    }
  },
  onGetUIState: async () => {
    "use server";

    const history: ServerMessage[] = getAIState();

    return history.map(({ role, content }) => ({
      id: Math.random().toString(),
      role,
      display: content,
    }));
  },
});
