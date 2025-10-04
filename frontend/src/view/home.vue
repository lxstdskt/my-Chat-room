<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="`聊天室 ${connectionStatus}`"
      left-text="退出"
      right-text="设置"
      @click-left="logout"
      @click-right="showSettings"
    />

    <!-- 连接状态提示 -->
    <div v-if="showConnectionAlert" class="connection-alert" :class="connectionAlertType">
      {{ connectionAlertMessage }}
    </div>

    <div class="chat-content">
      <!-- 在线用户侧边栏 -->
      <div class="user-sidebar">
        <h3>在线用户 ({{ onlineUsers.length }})</h3>
        <div class="user-list">
          <div
            v-for="user in onlineUsers"
            :key="user.id"
            class="user-item"
            :class="{ 'current-user': user.id === currentUser.id }"
          >
            <van-icon name="user-o" />
            <span>{{ user.username }}</span>
            <van-tag v-if="user.id === currentUser.id" type="primary">我</van-tag>
          </div>
        </div>
      </div>

      <!-- 聊天主区域 -->
      <div class="chat-main">
        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <!-- 系统消息 -->
          <div
            v-for="message in systemMessages"
            :key="message.id"
            class="message-item system-message"
          >
            <div class="message-content">
              <van-icon name="info" />
              {{ message.content }}
            </div>
          </div>

          <!-- 用户消息 -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{ 'own-message': message.isOwn }"
          >
            <div class="message-header" v-if="!message.isOwn">
              <span class="username">{{ message.username }}</span>
              <span class="time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              {{ message.content }}
            </div>
            <div class="message-footer" v-if="message.isOwn">
              <span class="time">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- 消息输入区域 -->
        <div class="input-area">
          <van-field
            v-model="newMessage"
            placeholder="输入消息..."
            rows="1"
            autosize
            type="textarea"
            @keypress.enter="sendMessage"
            :disabled="!isConnected"
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                @click="sendMessage"
                :disabled="!newMessage.trim() || !isConnected"
                :loading="sending"
              >
                {{ isConnected ? '发送' : '连接中...' }}
              </van-button>
            </template>
          </van-field>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useUserStore } from '../stores/user';
import { socketService } from '../services/socket.service';

export default {
  name: 'Home',
  
  setup() {
    const userStore = useUserStore();
    const router = useRouter();

    // 数据定义
    const newMessage = ref('');
    const messagesContainer = ref<HTMLElement | null>(null);
    const onlineUsers = ref<any[]>([]);
    const messages = ref<any[]>([]);
    const systemMessages = ref<any[]>([]);
    const sending = ref(false);
    const isConnected = ref(false);

    // 连接状态
    const connectionStatus = ref('连接中...');
    const showConnectionAlert = ref(false);
    const connectionAlertMessage = ref('');
    const connectionAlertType = ref('');

    // 当前用户信息 - 从 localStorage 获取
    const currentUser = reactive({
      id: '',
      username: ''
    });

    // 从 localStorage 获取用户信息
    const getUserFromStorage = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          currentUser.id = user.id?.toString() || `user_${Date.now()}`;
          currentUser.username = user.username || '未知用户';
          console.log('从 localStorage 获取的用户:', currentUser);
        } else {
          // 如果没有用户信息，使用随机生成
          currentUser.id = `user_${Date.now()}`;
          currentUser.username = `用户${Math.floor(Math.random() * 1000)}`;
          console.warn('未找到用户信息，使用随机用户:', currentUser);
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
        currentUser.id = `user_${Date.now()}`;
        currentUser.username = `用户${Math.floor(Math.random() * 1000)}`;
      }
    };

    // 显示连接状态提示
    const showConnectionStatus = (message: string, type: 'success' | 'error' | 'warning') => {
      connectionAlertMessage.value = message;
      connectionAlertType.value = type;
      showConnectionAlert.value = true;
      
      setTimeout(() => {
        showConnectionAlert.value = false;
      }, 3000);
    };

    // 初始化 WebSocket
    const initializeWebSocket = async () => {
      const token = userStore.token || localStorage.getItem('token');
      if (!token) {
        showConnectionStatus('未找到用户令牌，请重新登录', 'error');
        return;
      }

      // 确保用户信息已加载
      if (!currentUser.id || !currentUser.username) {
        getUserFromStorage();
      }

      connectionStatus.value = '连接中...';
      const connected = await socketService.connect(token);

      if (connected) {
        isConnected.value = true;
        connectionStatus.value = '已连接';
        showConnectionStatus('已连接到聊天室', 'success');
        console.log('WebSocket 连接成功，开始设置消息处理器');

        setupMessageHandlers();
        
        // 添加欢迎消息
        systemMessages.value.push({
          id: Date.now(),
          content: `欢迎 ${currentUser.username} 加入聊天室！`,
          timestamp: new Date()
        });
      } else {
        isConnected.value = false;
        connectionStatus.value = '连接失败';
        showConnectionStatus('连接失败，请检查网络', 'error');
      }
    };
  
    // 设置消息处理器
    const setupMessageHandlers = () => {
      console.log('设置消息处理器...');

      // 处理在线用户列表 - 重要：完全替换现有列表
      socketService.on('online_users', (data: any) => {
        console.log('收到在线用户列表:', data);
        if (data && data.users) {
          onlineUsers.value = data.users; // 完全替换，不要push
          console.log('更新后的在线用户:', onlineUsers.value);
        }
      });

      // 处理新消息
      socketService.on('new_private_message', (data: any) => {
        console.log('收到新消息:', data);
        console.log('当前用户ID:', currentUser.id, '消息发送者ID:', data.fromUserId);
        
        // 根据用户ID判断是否是自己发的消息
        const isOwnMessage = data.fromUserId === currentUser.id;
        console.log('是否是自己发的消息:', isOwnMessage);
        
        messages.value.push({
          id: Date.now() + Math.random(),
          userId: data.fromUserId,
          username: data.username,
          content: data.content,
          timestamp: new Date(data.timestamp),
          isOwn: isOwnMessage  // 使用这个字段来显示样式
        });
        scrollToBottom();
      });

      // 处理用户上线
      socketService.on('user_online', (data: any) => {
        console.log('用户上线:', data);
        
        // 检查是否已存在该用户，避免重复添加
        const userExists = onlineUsers.value.some(user => user.id === data.userId);
        if (!userExists) {
          onlineUsers.value.push({
            id: data.userId,
            username: data.username
          });
          console.log('添加新用户后的在线列表:', onlineUsers.value);
          
          // 只有新用户才显示系统消息
          systemMessages.value.push({
            id: Date.now(),
            content: data.message || `${data.username} 加入了聊天室`,
            timestamp: new Date()
          });
          scrollToBottom();
        }
      });

      // 处理用户下线
      socketService.on('user_offline', (data: any) => {
        console.log('用户下线:', data);
        onlineUsers.value = onlineUsers.value.filter(user => user.id !== data.userId);
        console.log('用户下线后的在线列表:', onlineUsers.value);
        
        systemMessages.value.push({
          id: Date.now(),
          content: data.message || `${data.username} 离开了聊天室`,
          timestamp: new Date()
        });
        scrollToBottom();
      });

      console.log("消息处理器设置完成");
    };

    // 发送消息
    const sendMessage = async () => {
      if (!newMessage.value.trim() || !isConnected.value) return;

      sending.value = true;
      
      const messageContent = newMessage.value.trim();
      newMessage.value = '';

      console.log('准备发送消息:', messageContent, '用户:', currentUser.username);

      // 通过 WebSocket 发送消息
      const success = socketService.sendChatMessage(messageContent);
      
      if (success) {
        console.log('消息发送成功，等待服务器返回');
        // 不再本地添加消息，完全依赖服务器返回
      } else {
        // 发送失败显示错误
        showConnectionStatus('消息发送失败', 'error');
        console.error('消息发送失败');
        
        // 添加失败消息到界面
        messages.value.push({
          id: Date.now(),
          userId: currentUser.id,
          username: currentUser.username,
          content: '[发送失败] ' + messageContent,
          timestamp: new Date(),
          isOwn: true
        });
        scrollToBottom();
      }
      
      sending.value = false;
    };

    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        nextTick(() => {
          messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight;
        });
      }
    };

    // 格式化时间
    const formatTime = (timestamp: Date) => {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 退出登录
    const logout = async () => {
      try {
        await showConfirmDialog({
          title: '确认退出',
          message: '您确定要退出登录吗？'
        });
        
        socketService.disconnect();
        userStore.logout();
        router.push('/login');
      } catch {
        // 用户取消退出
      }
    };

    // 显示设置
    const showSettings = () => {
      showToast('设置功能开发中...');
    };

    // 初始化数据
    const initializeData = () => {
      console.log('=== 初始化数据开始 ===');
      
      // 先获取用户信息
      getUserFromStorage();
      console.log('当前用户信息:', currentUser);
      
      // 初始化一些示例消息
      messages.value = [
        {
          id: 1,
          userId: 'system',
          username: '系统',
          content: `欢迎 ${currentUser.username} 来到聊天室！`,
          timestamp: new Date(),
          isOwn: false
        }
      ];

      // 初始化在线用户列表（当前用户）
      onlineUsers.value = [
        { id: currentUser.id, username: currentUser.username }
      ];
      console.log('初始在线用户:', onlineUsers.value);

      // 初始化 WebSocket
      initializeWebSocket();
      
      console.log('=== 初始化数据完成 ===');
    };

    // 返回所有需要暴露给模板的数据和方法
    return {
      newMessage,
      messagesContainer,
      onlineUsers,
      messages,
      systemMessages,
      sending,
      isConnected,
      connectionStatus,
      showConnectionAlert,
      connectionAlertMessage,
      connectionAlertType,
      currentUser,
      sendMessage,
      formatTime,
      logout,
      showSettings,
      initializeData,
      scrollToBottom
    };
  },
  
  mounted() {
    this.initializeData();
  },

  beforeUnmount() {
    // 组件销毁时断开连接
    socketService.disconnect();
  }
};
</script>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 用户侧边栏 */
.user-sidebar {
  width: 200px;
  background: #f7f8fa;
  border-right: 1px solid #ebedf0;
  padding: 16px;
  overflow-y: auto;
}

.user-sidebar h3 {
  margin-bottom: 16px;
  color: #323233;
  font-size: 14px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  font-size: 14px;
}

.user-item.current-user {
  background: #e1f5fe;
  color: #1976d2;
}

.user-item .van-icon {
  margin-right: 8px;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f0f2f5;
}

/* 消息项 */
.message-item {
  margin-bottom: 16px;
  max-width: 70%;
}

.message-item.own-message {
  margin-left: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.message-content {
  padding: 12px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.own-message .message-content {
  background: #1989fa;
  color: white;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.own-message .message-footer {
  color: rgba(255, 255, 255, 0.8);
}

/* 输入区域 */
.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #ebedf0;
}

/* 新增样式 */
.connection-alert {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  border-bottom: 1px solid;
}

.connection-alert.success {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.connection-alert.error {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.connection-alert.warning {
  background: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.system-message {
  justify-content: center;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.system-message .message-content {
  background: transparent;
  box-shadow: none;
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 4px 8px;
}

.system-message .van-icon {
  margin-right: 4px;
}

.sending-text {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}
</style>