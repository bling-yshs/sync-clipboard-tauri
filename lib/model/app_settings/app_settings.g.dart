// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_settings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppSettings _$AppSettingsFromJson(Map<String, dynamic> json) => _AppSettings(
  trustInsecureCert: json['trustInsecureCert'] as bool? ?? false,
  manualUploadDialogShown: json['manualUploadDialogShown'] as bool? ?? false,
);

Map<String, dynamic> _$AppSettingsToJson(_AppSettings instance) =>
    <String, dynamic>{
      'trustInsecureCert': instance.trustInsecureCert,
      'manualUploadDialogShown': instance.manualUploadDialogShown,
    };
