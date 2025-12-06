import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:sync_clipboard_flutter/model/server_config/server_config.dart';
import 'package:sync_clipboard_flutter/dio/sync_clipboard_client.dart';
import 'package:logger/logger.dart';
import 'package:sync_clipboard_flutter/model/clipboard/clipboard.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // 创建 Logger 实例 - 用于记录日志
  final Logger _log = Logger();

  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  static const String _serverStorageKey = 'server_config';

  @override
  void initState() {
    super.initState();
    _loadSavedConfig();
    
    // 监听文本变化，实时保存
    _urlController.addListener(_saveConfig);
    _usernameController.addListener(_saveConfig);
    _passwordController.addListener(_saveConfig);
  }

  @override
  void dispose() {
    _urlController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // 加载保存的配置
  Future<void> _loadSavedConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final savedJson = prefs.getString(_serverStorageKey);
    
    if (savedJson != null && savedJson.isNotEmpty) {
      try {
        final config = serverConfigFromJson(savedJson);
        _urlController.text = config.url;
        _usernameController.text = config.username;
        _passwordController.text = config.password;
      } catch (e) {
        // 如果解析失败，使用默认值
        _urlController.text = '';
        _usernameController.text = '';
        _passwordController.text = '';
      }
    }
  }

  // 保存配置到 SharedPreferences
  Future<void> _saveConfig() async {
    final config = ServerConfig(
      url: _urlController.text,
      username: _usernameController.text,
      password: _passwordController.text,
    );
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_serverStorageKey, serverConfigToJson(config));
  }

  // 测试服务器连接
  Future<void> _testConnection() async {
    // 从 SharedPreferences 读取配置
    final prefs = await SharedPreferences.getInstance();
    final savedJson = prefs.getString(_serverStorageKey);
    
    if (savedJson == null || savedJson.isEmpty) {
      Fluttertoast.showToast(
        msg: '请先填写服务器配置',
      );
      return;
    }

    try {
      // 从保存的配置中解析
      final config = serverConfigFromJson(savedJson);
      
      // 验证配置是否完整
      if (config.url.isEmpty || config.username.isEmpty || config.password.isEmpty) {
        Fluttertoast.showToast(
          msg: '请填写完整的服务器配置',
        );
        return;
      }

      // 📝 日志示例 1: 记录信息级别的日志
      _log.i('开始连接服务器: ${config.url}');

      // 创建客户端并获取数据
      final client = await SyncClipboardClient.create();
      final clipboard = await client.getSyncClipboardJson();

      // 📝 日志示例 2: 记录成功获取的数据
      _log.d('成功获取剪贴板数据 - 类型: ${clipboard.type.name}, 内容长度: ${clipboard.clipboard.length}');

      // 显示成功结果
      Fluttertoast.showToast(
        msg: '连接成功',
      );
    } on SyncClipboardException catch (e) {
      // 处理业务异常
      if (e.statusCode == 404) {
        // 📝 日志示例 3: 记录警告级别的日志
        _log.w('文件不存在，尝试创建新文件...');
        
        try {
          // 文件不存在，创建一个空的 Clipboard
          final client = await SyncClipboardClient.create();
          
          // 创建一个空的 Clipboard 对象
          final emptyClipboard = const Clipboard(
            file: '',
            clipboard: '',
            type: ClipboardType.text,
          );
          
          // 上传到服务器
          await client.putSyncClipboardJson(emptyClipboard);
          
          // 📝 日志示例 4: 记录成功信息
          _log.i('成功创建空的 SyncClipboard.json 文件');
          
          Fluttertoast.showToast(
            msg: '首次使用，已自动创建配置文件！',
          );
        } catch (createError) {
          // 📝 日志示例 5: 记录错误级别的日志
          _log.e('创建文件失败', error: createError);
          
          Fluttertoast.showToast(
            msg: '创建文件失败：$createError',
          );
        }
      } else {
        // 其他业务异常
        _log.w('业务异常: ${e.message}', error: e);
        
        Fluttertoast.showToast(
          msg: e.message,
        );
      }
    } catch (e) {
      // 📝 日志示例 6: 记录未知错误
      _log.e('未知错误', error: e);
      
      // 处理其他未知异常
      Fluttertoast.showToast(
        msg: '发生错误：$e',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '服务器配置',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _urlController,
            decoration: const InputDecoration(
              labelText: '服务器地址',
              hintText: '请输入服务器地址',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.dns),
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _usernameController,
            decoration: const InputDecoration(
              labelText: '用户名',
              hintText: '请输入用户名',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordController,
            decoration: const InputDecoration(
              labelText: '密码',
              hintText: '请输入密码',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.lock),
            ),
            obscureText: true,
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _testConnection,
            icon: const Icon(Icons.link),
            label: const Text('尝试连接到服务器'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
