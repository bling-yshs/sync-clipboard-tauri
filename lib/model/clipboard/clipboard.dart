import 'package:freezed_annotation/freezed_annotation.dart';
import 'dart:convert';

part 'clipboard.freezed.dart';
part 'clipboard.g.dart';

Clipboard clipboardFromJson(String str) =>
    Clipboard.fromJson(json.decode(str));

String clipboardToJson(Clipboard data) =>
    json.encode(data.toJson());

@freezed
abstract class Clipboard with _$Clipboard {
  const factory Clipboard({
    @JsonKey(name: 'File')
    required String file,

    @JsonKey(name: 'Clipboard')
    required String clipboard,

    @JsonKey(name: 'Type')
    required ClipboardType type,
  }) = _Clipboard;

  factory Clipboard.fromJson(Map<String, dynamic> json) =>
      _$ClipboardFromJson(json);
}

/// Type 字段的枚举
@JsonEnum(alwaysCreate: true)
enum ClipboardType {
  @JsonValue('Text')
  text,

  @JsonValue('Image')
  image,

  @JsonValue('File')
  file,

  @JsonValue('Group')
  group,
}
