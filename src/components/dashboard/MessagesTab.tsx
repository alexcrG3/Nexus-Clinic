import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, Phone, Video, Settings, MessageSquare, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Conversation {
  id: number;
  messages: {
    content: string;
    created_at: number;
  }[];
  meta: {
    sender: {
      name: string;
      email?: string;
      phone_number?: string;
    };
  };
  unread_count: number;
  status: string;
}

interface Message {
  id: number;
  content: string;
  message_type: number; // 0 = incoming, 1 = outgoing
  created_at: number;
  sender?: {
    name: string;
  };
}

const MessagesTab = () => {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke("chatwoot-proxy", {
        body: { action: "get_conversations" },
      });

      if (response.error) {
        console.error("Error fetching conversations:", response.error);
        return;
      }

      if (response.data?.configured === false) {
        setConfigured(false);
        return;
      }

      setConfigured(true);
      const conversationData = response.data?.data?.data?.payload || response.data?.data?.payload || [];
      setConversations(conversationData);
      
      if (conversationData.length > 0) {
        setSelectedConversation(conversationData[0]);
        fetchMessages(conversationData[0].id);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      setLoadingMessages(true);
      const response = await supabase.functions.invoke("chatwoot-proxy", {
        body: { action: "get_messages", conversationId },
      });

      if (response.error) {
        console.error("Error fetching messages:", response.error);
        return;
      }

      const messagesData = response.data?.data?.payload || response.data?.data || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await supabase.functions.invoke("chatwoot-proxy", {
        body: {
          action: "send_message",
          conversationId: selectedConversation.id,
          message: newMessage,
        },
      });

      if (response.error) {
        console.error("Error sending message:", response.error);
        return;
      }

      setNewMessage("");
      // Refresh messages
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.meta?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!configured) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Configura Chatwoot</CardTitle>
          <CardDescription>
            Para ver tus conversaciones, primero necesitas configurar la integración con Chatwoot
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link to="/dashboard/configuracion">
              <Settings className="h-4 w-4 mr-2" />
              Ir a Configuración
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Conversaciones</CardTitle>
          <CardDescription>
            {conversations.length} conversaciones activas
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversación..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay conversaciones
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <Avatar>
                  <AvatarFallback>
                    {getInitials(conversation.meta?.sender?.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm truncate">
                      {conversation.meta?.sender?.name || "Sin nombre"}
                    </p>
                    {conversation.messages?.[0]?.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(conversation.messages[0].created_at * 1000),
                          "HH:mm",
                          { locale: es }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.messages?.[0]?.content || "Sin mensajes"}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="rounded-full">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedConversation.meta?.sender?.name || "Sin nombre"}
                  </CardTitle>
                  <CardDescription>
                    {selectedConversation.meta?.sender?.phone_number ||
                      selectedConversation.meta?.sender?.email ||
                      "Sin contacto"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay mensajes
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.message_type === 1 ? "justify-end" : ""
                      }`}
                    >
                      {message.message_type === 0 && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(
                              selectedConversation.meta?.sender?.name || "?"
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[70%] ${
                          message.message_type === 1
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span
                          className={`text-xs ${
                            message.message_type === 1
                              ? "opacity-70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(
                            new Date(message.created_at * 1000),
                            "HH:mm",
                            { locale: es }
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={sendingMessage}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-[500px]">
            <p className="text-muted-foreground">
              Selecciona una conversación para ver los mensajes
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MessagesTab;
