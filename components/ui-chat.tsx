"use client";

import type React from "react";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { SendHorizontalIcon, ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { deleteFileFromR2, uploadFileToR2 } from "@/lib/upload-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Markdown } from "@/components/markdown";
import { CopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { MessageContent, Message as LocalMessage } from "@/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useRouter } from "next/navigation";

const CHAT_MODELS = [
  { value: "accounts/fireworks/models/deepseek-r1", label: "Deepseek/DeepSeek R1 via Fireworks" },
  { value: "deepseek-ai/DeepSeek-R1", label: "Deepseek/DeepSeek R1 via TogetherAI" },
  { value: "gemini-2.0-flash", label: "Google/Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-thinking-exp-01-21", label: "Google/Gemini 2.0 Flash Thinking Experimental" },
  { value: "o1-preview", label: "OpenAI/o1-preview" },
  { value: "o1-mini", label: "OpenAI/o1-mini" },
  { value: "gpt-4o", label: "OpenAI/GPT-4o" },
  { value: "gpt-4o-mini", label: "OpenAI/GPT-4o-mini" },
  { value: "claude-3-5-sonnet-20241022", label: "Anthropic/Claude 3.5 Sonnet" },
];

const MODELS_WITHOUT_IMAGE_SUPPORT = ["o1-preview", "o1-mini", "accounts/fireworks/models/deepseek-r1", "deepseek-ai/DeepSeek-R1"];

export function Chat({
  userId,
  id,
  chatAreaId,
  initialModel,
  initialSystem,
  initialMessages,
}: {
  userId: string | undefined;
  id: string;
  chatAreaId: "left" | "right";
  initialModel: string;
  initialSystem?: string;
  initialMessages?: LocalMessage[];
}) {
  const router = useRouter();
  const [model, setModel] = useState(() => {
    const isValidModel = CHAT_MODELS.some((m) => m.value === initialModel);
    return isValidModel ? initialModel : "gemini-2.0-flash";
  });
  const [system, setSystem] = useState<string | undefined>(initialSystem);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [_, setNewChatId] = useLocalStorage("newChatId", id);
  const [userScrolled, setUserScrolled] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    // @ts-ignore - required because of legacy code how handling pictures was implemented
    initialMessages,
    sendExtraMessageFields: true,
    body: {
      id,
      userId,
      model,
      system,
      chatAreaId,
    },
  });

  useEffect(() => {
    setNewChatId(id);
  }, []);

  // useEffect(() => {
  //   const messagesLength = messages?.length;
  //   if (messagesLength % 2 === 0 && messagesLength > 0) {
  //     router.refresh();
  //   }
  // }, [messages, router]);

  useEffect(() => {
    const viewport = scrollAreaRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      if (scrollTop + clientHeight < scrollHeight) {
        setUserScrolled(true);
      }
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => {
      setUserScrolled(false);
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [messages.length % 2 === 0]);

  useEffect(() => {
    if (scrollAreaRef.current === null || userScrolled) return;
    scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
  }, [messages, userScrolled]);

  const { handleImageUpload } = useImageUpload({
    onImageUpload: (url) => setUploadedImage(url),
    uploadFileToR2,
    startTransition,
    disabled: status === "streaming" || isPending || !!uploadedImage || MODELS_WITHOUT_IMAGE_SUPPORT.includes(model),
  });

  const handleDeleteImage = async () => {
    if (!uploadedImage) return;

    startTransition(async () => {
      try {
        const { success } = await deleteFileFromR2(uploadedImage);
        if (success) {
          setUploadedImage(null);
          toast.success("Image deleted successfully");
        } else {
          throw new Error("Failed to delete image");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error("Failed to delete image");
      }
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      experimental_attachments: uploadedImage
        ? [
            {
              name: "image",
              contentType: "image/*",
              url: uploadedImage,
            },
          ]
        : undefined,
    });

    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasImagesInConversation = messages.some((m) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image"));

  return (
    <div className="w-full p-4 flex flex-col h-[80vh]">
      <div className="flex justify-between">
        <Select onValueChange={setModel} value={model}>
          <SelectTrigger className="max-w-72 mb-2">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Models</SelectLabel>
              {CHAT_MODELS.map(({ value, label }) => (
                <SelectItem key={value} value={value} disabled={hasImagesInConversation && MODELS_WITHOUT_IMAGE_SUPPORT.includes(value)}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="mb-2">
              System Prompt
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 m-4">
            <Textarea className="p-2 h-48" value={system || ""} onChange={(e) => setSystem(e.target.value)} placeholder="Enter a system prompt" />
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="mb-2 grow rounded-md border p-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div key={message.id} className="mr-6 whitespace-pre-wrap md:mr-12">
            {message.role === "user" ? (
              <div className="mb-6 flex gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="text-sm">U</AvatarFallback>
                </Avatar>
                <div className="mt-1.5">
                  <p className="font-semibold opacity-70">You</p>
                  <div className="mt-1.5 text-sm leading-relaxed">
                    {Array.isArray(message.content)
                      ? message.content.map((item: MessageContent, index) => (
                          <div key={index}>
                            {item.type === "text" && item.text}
                            {item.type === "image" && <img src={item.image || "/placeholder.svg"} alt="uploaded image" className="mt-2 max-w-xs rounded" />}
                          </div>
                        ))
                      : message.content}
                    {message.experimental_attachments?.map(
                      (attachment, index) =>
                        attachment.contentType?.startsWith("image/") && (
                          <div key={index} className="mb-2">
                            <img
                              src={attachment.url || "/placeholder.svg"}
                              alt={attachment.name || "Attached image"}
                              width={200}
                              height={200}
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
                  <AvatarFallback className="bg-emerald-500 text-white">AI</AvatarFallback>
                </Avatar>
                <div className="mt-1.5 w-full">
                  <div className="flex justify-between">
                    <p className="font-semibold opacity-70">Assistant</p>
                    <CopyToClipboard message={message} className="-mt-1" />
                  </div>
                  <div className="mt-2 text-sm leading-relaxed">
                    <Markdown>{message.content as string}</Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      <form onSubmit={onSubmit} className="relative">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          className={`placeholder:italic placeholder:text-zinc-600/75 focus-visible:ring-zinc-500 ${uploadedImage ? "pr-40" : "pr-28"}`}
          disabled={status === "streaming" || isPending}
        />
        <div className="flex items-center gap-3 mb-2 absolute bottom-2 right-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="text-emerald-500 h-8 w-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === "streaming" || isPending || !!uploadedImage || MODELS_WITHOUT_IMAGE_SUPPORT.includes(model)}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          {uploadedImage && (
            <div className="relative h-9 w-9">
              <img src={uploadedImage || "/placeholder.svg"} alt="uploaded image" className="h-full w-full object-cover rounded-sm" />
              <div onClick={handleDeleteImage} className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer bg-slate-700 rounded-full">
                <X className="h-4 w-4 text-emerald-500 m-1" />
              </div>
            </div>
          )}
          <Button
            size="icon"
            type="submit"
            variant="secondary"
            disabled={status === "streaming" || isPending || (input.trim() === "" && !uploadedImage)}
            className="h-8 w-10"
          >
            {status === "streaming" || isPending ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            ) : (
              <SendHorizontalIcon className="h-5 w-5 text-emerald-500" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
