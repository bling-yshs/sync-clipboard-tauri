import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:sync_clipboard_flutter/model/app_settings/app_settings.dart';

class ConfigPage extends StatefulWidget {
  const ConfigPage({super.key});

  @override
  State<ConfigPage> createState() => _ConfigPageState();
}

class _ConfigPageState extends State<ConfigPage> {
  static const String _settingsStorageKey = 'app_settings';
  
  AppSettings _settings = const AppSettings();
  bool _isLoading = true;
  String _version = '';
  bool _testSwitch = false; // 测试按钮状态

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    // 并行加载设置和版本信息
    await Future.wait([
      _loadSettings(),
      _loadVersion(),
    ]);
    
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final savedJson = prefs.getString(_settingsStorageKey);
    
    if (savedJson != null && savedJson.isNotEmpty) {
      try {
        final settings = appSettingsFromJson(savedJson);
        _settings = settings;
      } catch (e) {
        _settings = const AppSettings();
      }
    }
  }

  Future<void> _loadVersion() async {
    final packageInfo = await PackageInfo.fromPlatform();
    _version = packageInfo.version;
  }

  Future<void> _saveSettings(AppSettings newSettings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsStorageKey, appSettingsToJson(newSettings));
    setState(() {
      _settings = newSettings;
    });
  }

  Future<void> _toggleTrustInsecureCert(bool value) async {
    final newSettings = _settings.copyWith(trustInsecureCert: value);
    await _saveSettings(newSettings);
  }

  /// 构建分类标题
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      children: [
        // ===== 常规 =====
        _buildSectionHeader('常规'),
        
        // 信任不安全的 HTTPS 证书
        SwitchListTile(
          secondary: const Icon(Icons.gpp_maybe),
          title: const Text('信任不安全的 HTTPS 证书'),
          subtitle: const Text('开启后将跳过 HTTPS 证书校验'),
          value: _settings.trustInsecureCert,
          onChanged: _toggleTrustInsecureCert,
        ),
        
        // ===== 其它 =====
        _buildSectionHeader('其它'),
        
        // 软件版本
        ListTile(
          leading: const Icon(Icons.memory),
          title: const Text('软件版本'),
          subtitle: Text(_version),
        ),
        
        // 测试按钮
        SwitchListTile(
          secondary: const Icon(Icons.science),
          title: const Text('测试按钮'),
          subtitle: const Text('没有任何效果'),
          value: _testSwitch,
          onChanged: (value) {
            setState(() {
              _testSwitch = value;
            });
          },
        ),
      ],
    );
  }
}
