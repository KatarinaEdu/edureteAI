"use client";

import { forwardRef, useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/markdown";
import { CopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { UIMessage } from "ai";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  details?: Array<{ type: "text"; text: string }>;
}

interface ChatMessagesProps {
  messages: UIMessage[];
  userName: string | null | undefined;
  status?: "streaming" | "submitted" | "error" | "ready";
}

interface ReasoningSectionProps {
  part: ReasoningPart;
  isStreaming: boolean;
}

function ReasoningSection({ part, isStreaming }: ReasoningSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: "0.5rem",
    },
  };

  useEffect(() => {
    if (!isStreaming) {
      setIsExpanded(false);
    }
  }, [isStreaming]);

  return (
    <div className="flex flex-col my-2">
      {isStreaming ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Razmišljam...</div>
          <div className="animate-spin">
            <Loader2 className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Moje razmišljanje</div>
          <button
            className={cn("cursor-pointer rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200 p-1", {
              "dark:bg-zinc-800 bg-zinc-200": isExpanded,
            })}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm dark:text-zinc-400 text-zinc-600 flex flex-col gap-4 border-l-2 pl-3 dark:border-zinc-700 border-zinc-300"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {part.details && part.details.map((detail, detailIndex) => (detail.type === "text" ? <Markdown key={detailIndex}>{detail.text}</Markdown> : null))}
            {!part.details && part.reasoning && <Markdown>{part.reasoning}</Markdown>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(({ messages, userName, status }, ref) => {
  return (
    <ScrollArea className="mb-2 grow rounded-md border p-4 h-full min-h-32" ref={ref}>
      {messages.map((message) => (
        <div key={message.id} className="sm:mr-6 whitespace-pre-wrap md:mr-12">
          {message.role === "user" ? (
            <div className="mb-6 flex gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="text-sm">{userName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="mt-1.5">
                <p className="font-semibold opacity-70">{userName}</p>
                <div className="mt-1.5 text-sm leading-relaxed">
                  {/* start legacy  */}
                  {Array.isArray(message.content)
                    ? message.content.map((item, index) => (
                        <div key={index}>
                          {item.type === "text" && item.text}
                          {item.type === "image" && (
                            <Image src={item.image || "/placeholder.svg"} alt="Uploaded image" className="mt-2 max-w-xs rounded" width={250} height={250} />
                          )}
                        </div>
                      ))
                    : message.content}
                  {/*  end legacy  */}
                  {message.experimental_attachments?.map(
                    (attachment, index) =>
                      attachment.contentType?.startsWith("image/") && (
                        <div key={index} className="mb-2">
                          <Image
                            src={attachment.url || "/placeholder.svg"}
                            alt={attachment.name || "Attached image"}
                            width={250}
                            height={250}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-emerald-500 text-white">eAI</AvatarFallback>
              </Avatar>
              <div className="mt-1.5 w-full">
                <div className="flex justify-between">
                  <p className="font-semibold opacity-70">edureteAI</p>
                  <CopyToClipboard message={message} className="-mt-1" />
                </div>
                {message.parts.map((part, partIndex) => {
                  if (part.type === "reasoning") {
                    return (
                      <ReasoningSection
                        key={partIndex}
                        part={part as ReasoningPart}
                        isStreaming={status === "streaming" && partIndex === message.parts.length - 1}
                      />
                    );
                  }
                  return null;
                })}
                <div className="mt-2 text-sm leading-relaxed">
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </ScrollArea>
  );
});

ChatMessages.displayName = "ChatMessages";
