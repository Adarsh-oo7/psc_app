import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    SafeAreaView, 
    ActivityIndicator, 
    Alert,
    Dimensions
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
    const { user, fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const { data: initialMessages, isLoading, error } = useSWR(
        `/messaging/conversations/${conversationId}/messages/`,
        fetcher
    );

    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages.slice().reverse());
        }
    }, [initialMessages]);

    const connectWebSocket = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                Alert.alert("Authentication Error", "Please log in again.");
                return;
            }

            console.log("Attempting to connect WebSocket...");
            console.log("Conversation ID:", conversationId);
            console.log("Token available:", !!token);

            // Close existing connection if any
            if (ws.current) {
                console.log("Closing existing WebSocket connection");
                ws.current.close();
            }

            // IMPORTANT: Replace with your computer's local IP address
            const wsUrl = `ws://192.168.1.2:8000/ws/messaging/${conversationId}/?token=${token}`;
            console.log("WebSocket URL:", wsUrl);
            
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log("WebSocket connected successfully");
                setIsConnected(true);
                setIsReconnecting(false);
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (e) => {
                try {
                    console.log("Received WebSocket message:", e.data);
                    const data = JSON.parse(e.data);
                    setMessages(prev => [data, ...prev]);
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            };

            ws.current.onerror = (e) => {
                console.error("WebSocket error:", e);
                setIsConnected(false);
                
                // Show more detailed error information
                Alert.alert(
                    "WebSocket Error",
                    `Connection failed. Please check:\n• Network connection\n• Server is running\n• Correct IP address (192.168.1.2)\n• Port 8000 is accessible\n\nError: ${e.message || 'Unknown error'}`
                );
            };

            ws.current.onclose = (e) => {
                console.log("WebSocket disconnected:", e.code, e.reason);
                setIsConnected(false);
                
                // Attempt to reconnect if not a manual close
                if (e.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    setIsReconnecting(true);
                    reconnectAttempts.current++;
                    
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                } else if (reconnectAttempts.current >= maxReconnectAttempts) {
                    Alert.alert(
                        "Connection Failed",
                        "Unable to connect to chat server after multiple attempts. Please check your connection and try again."
                    );
                }
            };
        } catch (error) {
            console.error("Failed to connect WebSocket:", error);
            setIsConnected(false);
            Alert.alert("Connection Error", `Failed to initialize WebSocket: ${error.message}`);
        }
    }, [conversationId]);

    useEffect(() => {
        connectWebSocket();
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws.current) {
                ws.current.close(1000, "Component unmounting");
            }
        };
    }, [connectWebSocket]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        
        // Debug logging
        console.log("Attempting to send message...");
        console.log("WebSocket ready state:", ws.current?.readyState);
        console.log("Is connected:", isConnected);
        console.log("WebSocket states:", {
            CONNECTING: WebSocket.CONNECTING,
            OPEN: WebSocket.OPEN,
            CLOSING: WebSocket.CLOSING,
            CLOSED: WebSocket.CLOSED
        });
        
        if (!ws.current) {
            console.log("WebSocket is null, attempting to reconnect...");
            Alert.alert(
                "Connection Error", 
                "WebSocket not initialized. Trying to reconnect...",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Retry", onPress: connectWebSocket }
                ]
            );
            return;
        }

        if (ws.current.readyState !== WebSocket.OPEN) {
            console.log("WebSocket not open, current state:", ws.current.readyState);
            Alert.alert(
                "Connection Error", 
                `WebSocket not connected (state: ${ws.current.readyState}). Trying to reconnect...`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Retry", onPress: connectWebSocket }
                ]
            );
            return;
        }

        try {
            setIsSending(true);
            const messageToSend = newMessage.trim();
            const messagePayload = { 'message': messageToSend };
            
            console.log("Sending message payload:", messagePayload);
            ws.current.send(JSON.stringify(messagePayload));
            setNewMessage('');
            console.log("Message sent successfully");
        } catch (error) {
            console.error("Failed to send message:", error);
            Alert.alert("Error", `Failed to send message: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isMyMessage = item.sender?.username === user?.username;
        const showTimestamp = index === messages.length - 1 || 
            (messages[index + 1] && new Date(item.timestamp).toDateString() !== new Date(messages[index + 1].timestamp).toDateString());

        return (
            <View style={styles.messageWrapper}>
                <View style={[
                    styles.messageContainer, 
                    isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
                ]}>
                    <View style={[
                        styles.messageBubble, 
                        isMyMessage ? styles.myMessage : styles.theirMessage,
                        isDarkMode && (isMyMessage ? styles.myMessageDark : styles.theirMessageDark)
                    ]}>
                        {!isMyMessage && (
                            <Text style={[styles.senderName, isDarkMode && styles.senderNameDark]}>
                                {item.sender?.username || 'Unknown'}
                            </Text>
                        )}
                        <Text style={[
                            isMyMessage ? styles.myMessageText : styles.theirMessageText,
                            isDarkMode && styles.messageTextDark
                        ]}>
                            {item.text}
                        </Text>
                        <Text style={[
                            styles.timestamp,
                            isMyMessage ? styles.myTimestamp : styles.theirTimestamp,
                            isDarkMode && styles.timestampDark
                        ]}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                {showTimestamp && (
                    <Text style={[styles.dateHeader, isDarkMode && styles.dateHeaderDark]}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                )}
            </View>
        );
    };

    const ConnectionStatus = () => {
        if (isReconnecting) {
            return (
                <View style={[styles.statusBar, styles.reconnectingBar]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.statusText}>Reconnecting...</Text>
                </View>
            );
        }
        
        if (!isConnected) {
            return (
                <View style={[styles.statusBar, styles.disconnectedBar]}>
                    <Text style={styles.statusText}>Disconnected</Text>
                    <TouchableOpacity onPress={connectWebSocket} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={testConnection} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Test</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return (
            <View style={[styles.statusBar, styles.connectedBar]}>
                <Text style={styles.statusText}>Connected</Text>
            </View>
        );
    };

    const testConnection = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            console.log("=== CONNECTION TEST ===");
            console.log("Token exists:", !!token);
            console.log("Conversation ID:", conversationId);
            console.log("User:", user);
            
            // Test if the server is reachable
            const testUrl = `http://192.168.1.2:8000/messaging/conversations/${conversationId}/messages/`;
            console.log("Testing HTTP endpoint:", testUrl);
            
            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("HTTP Response status:", response.status);
            console.log("HTTP Response ok:", response.ok);
            
            if (response.ok) {
                Alert.alert("Connection Test", "✅ HTTP connection successful!\nWebSocket should work too.");
                // Try WebSocket connection
                connectWebSocket();
            } else {
                Alert.alert("Connection Test", `❌ HTTP connection failed!\nStatus: ${response.status}\nCheck if server is running on 192.168.1.2:8000`);
            }
        } catch (error) {
            console.error("Connection test error:", error);
            Alert.alert("Connection Test", `❌ Connection test failed!\nError: ${error.message}\n\nCheck:\n• Server is running\n• IP address is correct\n• Network connection`);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
                    Loading messages...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
                    Failed to load messages
                </Text>
                <TouchableOpacity onPress={() => window.location.reload()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen 
                options={{ 
                    title: "Chat", 
                    headerTintColor: isDarkMode ? '#fff' : '#000',
                    headerStyle: { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }
                }} 
            />
            
            <ConnectionStatus />
            
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                keyboardVerticalOffset={90}
            >
                <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        style={[styles.input, isDarkMode && styles.inputDark]}
                        placeholder="Type a message..."
                        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        multiline
                        maxLength={1000}
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!newMessage.trim() || isSending || !isConnected) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={!newMessage.trim() || isSending || !isConnected}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    reconnectingBar: {
        backgroundColor: '#F59E0B',
    },
    disconnectedBar: {
        backgroundColor: '#EF4444',
    },
    connectedBar: {
        backgroundColor: '#10B981',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
    },
    retryButton: {
        marginLeft: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    messagesList: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    messageWrapper: {
        marginVertical: 2,
    },
    messageContainer: {
        marginVertical: 2,
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    theirMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: width * 0.8,
        minWidth: 60,
    },
    myMessage: {
        backgroundColor: '#4A3780',
    },
    myMessageDark: {
        backgroundColor: '#5B21B6',
    },
    theirMessage: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    theirMessageDark: {
        backgroundColor: '#374151',
        borderColor: '#4B5563',
    },
    senderName: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '600',
    },
    senderNameDark: {
        color: '#9CA3AF',
    },
    myMessageText: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 22,
    },
    theirMessageText: {
        fontSize: 16,
        color: '#000',
        lineHeight: 22,
    },
    messageTextDark: {
        color: '#fff',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirTimestamp: {
        color: '#6B7280',
    },
    timestampDark: {
        color: '#9CA3AF',
    },
    dateHeader: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6B7280',
        marginVertical: 16,
        fontWeight: '500',
    },
    dateHeaderDark: {
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#fff',
        alignItems: 'flex-end',
    },
    inputContainerDark: {
        backgroundColor: '#1f2937',
        borderTopColor: '#374151',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#fff',
    },
    inputDark: {
        borderColor: '#4B5563',
        backgroundColor: '#374151',
        color: '#fff',
    },
    sendButton: {
        backgroundColor: '#4A3780',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    loadingTextDark: {
        color: '#9CA3AF',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    errorTextDark: {
        color: '#F87171',
    },
});