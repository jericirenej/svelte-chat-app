import { goto, invalidate } from "$app/navigation";
import { page } from "$app/stores";
import type { UsersTypingArgs } from "$lib/socket.types";
import { participantName } from "$lib/utils";
import type { MessageDto } from "@db/postgres";
import { get } from "svelte/store";
import { CHAT_ROUTE, MESSAGE_TAKE, ROOT_ROUTE } from "../../constants";
import { NOTIFICATION_MESSAGES } from "../../messages";
import type { LayoutData } from "../../routes/$types";
import type { LayoutChats, ParticipantData, SingleChatData } from "../../types";
import { csrfHeader, getCSRFLocal } from "./csrf-handlers";
import { handleNotification } from "./session-handlers";
import {
  chatPreviews,
  chats,
  notificationStore,
  socket,
  unreadChatMessages,
  userMap,
  usersTyping
} from "./stores";
import { handleUsers } from "./typing-users-handler";
export const LAYOUT_INVALIDATE = "app:user:chats";
export const currentChatId = () => get(page).params["chatId"] as string | undefined;
export const getChatHref = (chatId: string) => [get(page).url.origin, "api/chat", chatId].join("/");
export const getChatExistsHref = (chatId: string) => [getChatHref(chatId), "exists"].join("/");

export const postChatMessage = async (
  href: string,
  message: string
): Promise<MessageDto | false> => {
  try {
    const csrf = getCSRFLocal();
    if (!csrf) return false;
    const response = await fetch(href, {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "content-type": "application/json", ...csrfHeader(csrf) }
    });
    const data = (await response.json()) as MessageDto;
    return data;
  } catch {
    return false;
  }
};

/** Base on received layout data, populate the unreadChatMessages,
 * chatPreview, and userMap stores.
 *
 * Should be invoked in layout route. */
export const setPreviewAndUnreadOnLoad = (data: LayoutData) => {
  if (!data.chats) return;
  // If chat previews have already been set, return (since we are loading in layout
  // OR in root route after login).
  if (get(chatPreviews)) return;
  const chatPreviewData: LayoutChats[] = [];
  const unread = data.chats.reduce(
    (acc, chat) => {
      const { unreadMessages, ...rest } = chat;
      acc[chat.chatId] = unreadMessages;
      chatPreviewData.push(rest);
      return acc;
    },
    {} as Record<string, number>
  );
  // Ensure that unread data that is available beforehand (for example from navigating
  // to chat page directly) is not overwritten
  unreadChatMessages.update((data) => ({ ...unread, ...data }));
  chatPreviews.set(chatPreviewData);
};

/** Update preview data after a new message has been registered
 * in the current chat. */
export const updatePreviewData = (message: MessageDto) => {
  const { url } = get(page);
  // We can't have unread messages if we are in the chat that was updated.
  if (url.pathname !== `/${CHAT_ROUTE}/${message.chatId}`) {
    unreadChatMessages.update((unread) => {
      if (!unread[message.chatId]) return unread;
      unread[message.chatId]++;
      return unread;
    });
  }
  chatPreviews.update((chats) => {
    if (!chats) return chats;
    const target = chats.find((c) => c.chatId === message.chatId);
    if (!target) {
      return chats;
    }
    target.totalMessages++;
    target.message = message.message;
    return chats;
  });
};

export const sendMessage = async (message: string): Promise<boolean> => {
  const chatId = currentChatId();
  if (!chatId) {
    await goto(ROOT_ROUTE);
    return false;
  }
  const href = getChatHref(chatId);
  const messageResponse = await postChatMessage(href, message);
  if (messageResponse) {
    const clientSocket = get(socket);
    updateOnMessagePush(messageResponse);
    if (clientSocket) {
      clientSocket.emit("messagePush", messageResponse);
    }
  }
  return !!messageResponse;
};

export const loadPrevious = async () => {
  const chatId = currentChatId();
  if (!chatId) {
    await goto(ROOT_ROUTE);
    return;
  }
  const target = get(chats)[chatId];
  if (!target) {
    await goto(ROOT_ROUTE);
    return;
  }
  const href = getChatHref(chatId);
  const loaded = target.messages.length;
  const allLoaded = target.total === loaded;
  if (allLoaded) return;
  const url = new URL(href);
  url.searchParams.set("skip", loaded.toString());
  url.searchParams.set("take", Math.min(target.total - loaded, MESSAGE_TAKE).toString());
  const response = await fetch(url, {
    method: "GET",
    headers: { "content-type": "application/json" }
  });
  const data = (await response.json()) as SingleChatData;
  chats.update((chats) => {
    if (chats[chatId]) {
      chats[chatId].messages.push(...data.messages);
      chats[chatId].total = data.total;
    }
    return chats;
  });
};

export const updateAfterLeavingChat = (chatId: string) => {
  chatPreviews.update((previews) => {
    if (!previews) return previews;
    const filtered = previews.filter((chat) => chat.chatId !== chatId);
    return filtered;
  });
  unreadChatMessages.update((obj) => {
    delete obj[chatId];
    return obj;
  });
  chats.update((chatMap) => {
    delete chatMap[chatId];
    return chatMap;
  });
};

export const updateAfterChatLeftNotification = async (chatId: string, participantId: string) => {
  const response = await fetch(getChatExistsHref(chatId), {
    method: "GET",
    headers: { "content-type": "application/json" }
  });
  const { exists } = (await response.json()) as { exists: boolean };
  if (!exists) {
    updateAfterLeavingChat(chatId);
    return;
  }
  chats.update((chats) => {
    const target = chats[chatId];
    if (!target) return chats;
    target.participants = target.participants.filter((p) => p.id !== participantId);
    return chats;
  });
};

export const updateUsersTyping = ({ chatId, status, userId }: UsersTypingArgs) => {
  usersTyping.update((list) => {
    if (list[chatId] === undefined) {
      if (!status) return list;
      list[chatId] = { list: new Set<string>(), label: undefined };
    }
    const target = list[chatId];
    if (status) {
      target.list.add(userId);
    } else {
      target.list.delete(userId);
    }
    const users = [...target.list]
      .map((id) => get(userMap).get(id))
      .filter((u): u is ParticipantData => u !== undefined)
      .map((p) => participantName(p));

    target.label = handleUsers(users);
    return list;
  });
};

export const updateOnMessagePush = (message: MessageDto) => {
  chats.update((chats) => {
    const target = chats[message.chatId];
    if (!target) {
      return chats;
    }
    if (target.messages.find(({ id }) => id === message.chatId)) {
      return chats;
    }
    target.messages.unshift(message);
    target.total++;
    return chats;
  });
  updatePreviewData(message);
};

export const removeChat = async (chatId: string, participantId: string): Promise<void> => {
  const csrf = getCSRFLocal();
  if (!csrf) {
    notificationStore.addNotification({
      content: "No CSRF token found. Please login again.",
      type: "failure"
    });
    return;
  }
  const response = await fetch(`${get(page).url.origin}/api/chat/${chatId}`, {
    method: "DELETE",
    headers: csrfHeader(csrf)
  });
  await handleNotification({ response, successMsg: NOTIFICATION_MESSAGES.leftChatSuccess });
  get(socket)?.emit("participantLeftChat", chatId, participantId);
  updateAfterLeavingChat(chatId);
  await invalidate(LAYOUT_INVALIDATE);
  if (get(page).url.href.includes(chatId)) {
    await goto(ROOT_ROUTE);
  }
};

export const createChatHandler = async (
  chatId: string,
  chatLabel: string,
  participants: ParticipantData[]
) => {
  chatPreviews.update((previews) => {
    return [
      {
        chatId,
        chatLabel,
        participants,
        message: undefined,
        totalMessages: 0
      } as LayoutChats,
      ...(previews ?? [])
    ];
  });
  const clientSocket = get(socket);
  if (clientSocket) {
    clientSocket.emit("chatCreated", chatId, chatLabel, participants);
  }
  await goto(`${CHAT_ROUTE}/${chatId}`);
};
