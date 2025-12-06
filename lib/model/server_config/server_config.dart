// To parse this JSON data, do
//
//     final serverConfig = serverConfigFromJson(jsonString);

import 'package:freezed_annotation/freezed_annotation.dart';
import 'dart:convert';

part 'server_config.freezed.dart';
part 'server_config.g.dart';

ServerConfig serverConfigFromJson(String str) => ServerConfig.fromJson(json.decode(str));

String serverConfigToJson(ServerConfig data) => json.encode(data.toJson());

@freezed
abstract class ServerConfig with _$ServerConfig {
  const factory ServerConfig({
    required String url,
    required String username,
    required String password,
  }) = _ServerConfig;

  factory ServerConfig.fromJson(Map<String, dynamic> json) => _$ServerConfigFromJson(json);
}
