import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
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

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final savedJson = prefs.getString(_settingsStorageKey);
    
    if (savedJson != null && savedJson.isNotEmpty) {
      try {
        final settings = appSettingsFromJson(savedJson);
        setState(() {
          _settings = settings;
          _isLoading = false;
        });
      } catch (e) {
        setState(() {
          _settings = const AppSettings();
          _isLoading = false;
        });
      }
    } else {
      setState(() {
        _isLoading = false;
      });
    }
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      children: [
        // 信任不安全的 HTTPS 证书
        SwitchListTile(
          title: const Text('信任不安全的 HTTPS 证书'),
          subtitle: const Text('开启后将跳过 HTTPS 证书校验'),
          value: _settings.trustInsecureCert,
          onChanged: _toggleTrustInsecureCert,
        ),
        
        // 测试按钮
        SwitchListTile(
          title: const Text('测试按钮'),
          subtitle: const Text('没有任何效果'),
          value: false,
          onChanged: (value) {},
        ),
      ],
    );
  }
}
