import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageCircle, Mail, Search, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  message_type: 'chat' | 'formal';
  is_read: boolean;
  parent_id: string | null;
  created_at: string;
}

interface Contact {
  user_id: string;
  email: string;
  company_name: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageType, setMessageType] = useState<'chat' | 'formal'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts (all profiles except current user)
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    if (user.role === 'admin') {
      // Admin sees all clients
      const { data } = await supabase
        .from('profiles')
        .select('user_id, email, company_name')
        .neq('user_id', user.id);
      setContacts(data || []);
    } else {
      // Client sees admins + org members
      const contactSet = new Map<string, Contact>();

      // Fetch admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles?.length) {
        const adminIds = adminRoles.map(r => r.user_id);
        const { data } = await supabase
          .from('profiles')
          .select('user_id, email, company_name')
          .in('user_id', adminIds);
        (data || []).forEach(c => contactSet.set(c.user_id, c));
      }

      // Fetch org members (same organization)
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, organization_id');
      
      if (orgMembers?.length) {
        // Get my org
        const myOrg = orgMembers.find(m => m.user_id === user.id);
        if (myOrg) {
          const peerIds = orgMembers
            .filter(m => m.organization_id === myOrg.organization_id && m.user_id !== user.id)
            .map(m => m.user_id);
          if (peerIds.length) {
            const { data } = await supabase
              .from('profiles')
              .select('user_id, email, company_name')
              .in('user_id', peerIds);
            (data || []).forEach(c => contactSet.set(c.user_id, c));
          }
        }
      }

      setContacts(Array.from(contactSet.values()));
    }
    setLoading(false);
  }, [user]);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedContact) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
    
    // Mark received messages as read
    if (data?.length) {
      const unread = data.filter((m: any) => m.receiver_id === user.id && !m.is_read).map((m: any) => m.id);
      if (unread.length) {
        await supabase.from('messages').update({ is_read: true } as any).in('id', unread);
      }
    }
  }, [user, selectedContact]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Auto-select contact from URL query param
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const contactId = searchParams.get('contact');
    if (contactId && contacts.length > 0 && !selectedContact) {
      const found = contacts.find(c => c.user_id === contactId);
      if (found) setSelectedContact(found);
    }
  }, [searchParams, contacts, selectedContact]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
        fetchUnreadCounts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Unread counts per contact
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    const counts: Record<string, number> = {};
    (data || []).forEach((m: any) => {
      counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
    });
    setUnreadCounts(counts);
  }, [user]);

  useEffect(() => { fetchUnreadCounts(); }, [fetchUnreadCounts]);

  const filteredContacts = useMemo(() => {
    if (!searchContact) return contacts;
    const q = searchContact.toLowerCase();
    return contacts.filter(c => 
      c.company_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [contacts, searchContact]);

  const handleSend = async () => {
    if (!user || !selectedContact || !newMessage.trim()) return;
    if (messageType === 'formal' && !subject.trim()) {
      toast.error('Veuillez renseigner l\'objet du message');
      return;
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedContact.user_id,
      content: newMessage.trim(),
      subject: messageType === 'formal' ? subject.trim() : '',
      message_type: messageType,
    } as any);

    if (error) {
      toast.error('Erreur lors de l\'envoi');
      console.error(error);
      return;
    }

    setNewMessage('');
    if (messageType === 'formal') setSubject('');
    toast.success('Message envoyé');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && messageType === 'chat') {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="page-container flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <div className="page-container">
      <h1 className="section-title mb-4">Messagerie</h1>
      
      <div className="stat-card overflow-hidden flex" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {/* Contacts sidebar */}
        <div className={cn(
          "border-r border-border flex flex-col",
          selectedContact ? "hidden md:flex w-80" : "w-full md:w-80"
        )}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucun contact</p>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.user_id}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors",
                    selectedContact?.user_id === contact.user_id && "bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                      {unreadCounts[contact.user_id] > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {unreadCounts[contact.user_id]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{contact.company_name || contact.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedContact ? "hidden md:flex" : "flex"
        )}>
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedContact(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{selectedContact.company_name || selectedContact.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedContact.email}</p>
                </div>
                <Select value={messageType} onValueChange={(v: 'chat' | 'formal') => setMessageType(v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat"><span className="flex items-center gap-2"><MessageCircle className="w-3 h-3" /> Chat</span></SelectItem>
                    <SelectItem value="formal"><span className="flex items-center gap-2"><Mail className="w-3 h-3" /> Formel</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Aucun message. Commencez la conversation !</p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        )}>
                          {msg.message_type === 'formal' && msg.subject && (
                            <p className={cn("text-xs font-semibold mb-1", isMine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                              📧 {msg.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                            {formatTime(msg.created_at)}
                            {msg.message_type === 'formal' && (
                              <Badge variant="outline" className="ml-2 text-[9px] py-0 px-1">Formel</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 space-y-2">
                {messageType === 'formal' && (
                  <Input
                    placeholder="Objet du message..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder={messageType === 'chat' ? 'Tapez votre message...' : 'Rédigez votre message formel...'}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
                    rows={messageType === 'formal' ? 4 : 1}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim()} size="sm" className="self-end">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez un contact pour démarrer une conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
