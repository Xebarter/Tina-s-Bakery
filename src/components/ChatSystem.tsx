import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Phone, Video, MoreVertical, X, Check, CheckCheck, Circle } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping: boolean;
}

interface ChatSystemProps {
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSystem({ currentUserId, isOpen, onClose }: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock support user
  const supportUser: ChatUser = {
    id: 'support-1',
    name: 'Sarah - Customer Support',
    avatar: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg',
    isOnline: true,
    isTyping: false
  };

  // Mock messages for demo
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'support-1',
        senderName: 'Sarah - Customer Support',
        content: 'Hello! Welcome to Tina\'s Bakery. How can I help you today?',
        timestamp: new Date(Date.now() - 300000),
        type: 'text',
        status: 'read'
      },
      {
        id: '2',
        senderId: currentUserId,
        senderName: 'You',
        content: 'Hi! I\'d like to know about custom cake orders.',
        timestamp: new Date(Date.now() - 240000),
        type: 'text',
        status: 'read'
      },
      {
        id: '3',
        senderId: 'support-1',
        senderName: 'Sarah - Customer Support',
        content: 'I\'d be happy to help with custom cake orders! We offer a wide variety of designs and flavors. What type of occasion are you planning for?',
        timestamp: new Date(Date.now() - 180000),
        type: 'text',
        status: 'read'
      }
    ];
    setMessages(mockMessages);
  }, [currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    const messageId = `msg-${Date.now()}`;
    
    if (selectedFile) {
      // Handle file upload
      const fileMessage: Message = {
        id: messageId,
        senderId: currentUserId,
        senderName: 'You',
        content: selectedFile.name,
        timestamp: new Date(),
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        status: 'sent',
        fileUrl: URL.createObjectURL(selectedFile),
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      };
      
      setMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setUploadProgress(0);
      
      // Update message status
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);
    }

    if (newMessage.trim()) {
      const textMessage: Message = {
        id: `msg-${Date.now()}-text`,
        senderId: currentUserId,
        senderName: 'You',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };
      
      setMessages(prev => [...prev, textMessage]);
      setNewMessage('');
      
      // Simulate delivery and read status
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === textMessage.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === textMessage.id ? { ...msg, status: 'read' } : msg
        ));
      }, 2000);

      // Simulate support response
      setTimeout(() => {
        const supportResponse: Message = {
          id: `support-${Date.now()}`,
          senderId: 'support-1',
          senderName: 'Sarah - Customer Support',
          content: 'Thank you for your message! I\'ll get back to you shortly with more information.',
          timestamp: new Date(),
          type: 'text',
          status: 'sent'
        };
        setMessages(prev => [...prev, supportResponse]);
      }, 3000);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={supportUser.avatar}
                alt={supportUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {supportUser.isOnline && (
                <Circle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 fill-current" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{supportUser.name}</h3>
              <p className="text-xs text-green-600">
                {supportUser.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <Video className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUserId
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'image' && message.fileUrl && (
                  <img
                    src={message.fileUrl}
                    alt="Shared image"
                    className="rounded-lg mb-2 max-w-full h-auto"
                  />
                )}
                
                {message.type === 'file' && (
                  <div className="flex items-center space-x-2 mb-2 p-2 bg-white bg-opacity-20 rounded">
                    <Paperclip className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.fileName}</p>
                      <p className="text-xs opacity-75">{formatFileSize(message.fileSize || 0)}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-75">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.senderId === currentUserId && (
                    <div className="ml-2">
                      {getStatusIcon(message.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {supportUser.isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
                <span className="text-xs text-gray-400">({formatFileSize(selectedFile.size)})</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {uploadProgress > 0 && (
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-amber-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              className="p-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}