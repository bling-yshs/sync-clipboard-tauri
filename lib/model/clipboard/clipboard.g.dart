// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'clipboard.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Clipboard _$ClipboardFromJson(Map<String, dynamic> json) => _Clipboard(
  file: json['File'] as String,
  clipboard: json['Clipboard'] as String,
  type: $enumDecode(_$ClipboardTypeEnumMap, json['Type']),
);

Map<String, dynamic> _$ClipboardToJson(_Clipboard instance) =>
    <String, dynamic>{
      'File': instance.file,
      'Clipboard': instance.clipboard,
      'Type': _$ClipboardTypeEnumMap[instance.type]!,
    };

const _$ClipboardTypeEnumMap = {
  ClipboardType.text: 'Text',
  ClipboardType.image: 'Image',
  ClipboardType.file: 'File',
  ClipboardType.group: 'Group',
};
