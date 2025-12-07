// 应用设置模型
// 使用 SharedPreferences 进行持久化存储

import 'package:freezed_annotation/freezed_annotation.dart';
import 'dart:convert';

part 'app_settings.freezed.dart';
part 'app_settings.g.dart';

AppSettings appSettingsFromJson(String str) => AppSettings.fromJson(json.decode(str));

String appSettingsToJson(AppSettings data) => json.encode(data.toJson());

@freezed
abstract class AppSettings with _$AppSettings {
  const factory AppSettings({
    /// 是否信任不安全的 HTTPS 证书
    /// 开启后，Dio 请求将不校验 HTTPS 证书
    /// 注意：这会降低安全性，仅建议在开发/测试环境使用
    @Default(false) bool trustInsecureCert,
  }) = _AppSettings;

  factory AppSettings.fromJson(Map<String, dynamic> json) => _$AppSettingsFromJson(json);
}
