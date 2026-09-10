#!/usr/bin/env python3
"""
JDUB Hub - Telegram Group Data Exporter
Exports messages, media, files from Telegram group to JSON + files.

Usage:
1. pip install telethon
2. Get API_ID and API_HASH from https://my.telegram.org
3. Run: python3 export_telegram.py --api-id YOUR_ID --api-hash YOUR_HASH --phone YOUR_PHONE

This will export all data from @hindidubbedfilmmovie group.
"""

import json
import os
import sys
import argparse
import asyncio
from datetime import datetime

try:
    from telethon import TelegramClient
    from telethon.tl.types import (
        MessageMediaPhoto, MessageMediaDocument,
        DocumentAttributeVideo, DocumentAttributeAudio,
        DocumentAttributeFilename
    )
except ImportError:
    print("Installing telethon...")
    os.system(f"{sys.executable} -m pip install telethon")
    from telethon import TelegramClient
    from telethon.tl.types import (
        MessageMediaPhoto, MessageMediaDocument,
        DocumentAttributeVideo, DocumentAttributeAudio,
        DocumentAttributeFilename
    )

# Config
SESSION_NAME = 'jdub_export'
TARGET_GROUP = 'hindidubbedfilmmovie'
OUTPUT_DIR = 'telegram_export'
OUTPUT_JSON = 'telegram_messages.json'


async def get_file_info(media):
    """Extract file info from message media"""
    if isinstance(media, MessageMediaPhoto):
        return {'type': 'photo', 'has_media': True}
    elif isinstance(media, MessageMediaDocument):
        doc = media.document
        file_name = ''
        file_size = doc.size if doc.size else 0
        mime = doc.mime_type or ''
        duration = 0

        for attr in doc.attributes:
            if isinstance(attr, DocumentAttributeFilename):
                file_name = attr.file_name
            elif isinstance(attr, DocumentAttributeVideo):
                duration = attr.duration
            elif isinstance(attr, DocumentAttributeAudio):
                duration = attr.duration

        # Determine media type from mime
        if mime.startswith('video'):
            media_type = 'video'
        elif mime.startswith('audio'):
            media_type = 'audio'
        elif mime.startswith('image'):
            media_type = 'photo'
        else:
            media_type = 'document'

        return {
            'type': media_type,
            'file_name': file_name,
            'file_size': file_size,
            'mime': mime,
            'duration': duration,
            'has_media': True,
            'document_id': doc.id
        }
    return {'type': 'none', 'has_media': False}


async def export_group(api_id, api_hash, phone):
    """Export all messages from the target group"""
    client = TelegramClient(SESSION_NAME, api_id, api_hash)
    await client.start(phone=phone)

    print(f"✅ Connected as {phone}")
    print(f"🔍 Looking for group: {TARGET_GROUP}...")

    try:
        entity = await client.get_entity(TARGET_GROUP)
    except Exception as e:
        print(f"❌ Group not found: {e}")
        print("Make sure the group username is correct.")
        await client.disconnect()
        return

    print(f"✅ Found: {entity.title}")
    print(f"📥 Exporting messages...")

    messages = []
    media_count = 0
    text_count = 0

    async for message in client.iter_messages(entity, limit=None):
        msg_data = {
            'id': message.id,
            'date': message.date.isoformat() if message.date else '',
            'text': message.text or message.message or '',
            'sender_id': message.sender_id,
            'has_media': message.media is not None,
        }

        if message.media:
            file_info = await get_file_info(message.media)
            msg_data.update(file_info)
            media_count += 1

            if file_info.get('document_id'):
                # Download media files
                try:
                    media_dir = os.path.join(OUTPUT_DIR, file_info['type'] + 's')
                    os.makedirs(media_dir, exist_ok=True)
                    filename = file_info.get('file_name') or f"{file_info['type']}_{message.id}"
                    filepath = os.path.join(media_dir, filename)

                    if not os.path.exists(filepath):
                        await client.download_media(message, file=filepath)
                        msg_data['local_file'] = filepath
                        if message.id % 100 == 0:
                            print(f"  📥 Downloaded {media_count} media files...")
                except Exception as e:
                    msg_data['download_error'] = str(e)
        else:
            text_count += 1

        messages.append(msg_data)

        if len(messages) % 500 == 0:
            print(f"  📝 Processed {len(messages)} messages...")

    # Save to JSON
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_JSON)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'group': entity.title,
            'group_id': entity.id,
            'exported_at': datetime.now().isoformat(),
            'total_messages': len(messages),
            'text_messages': text_count,
            'media_messages': media_count,
            'messages': messages
        }, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Export Complete!")
    print(f"📊 Total messages: {len(messages)}")
    print(f"💬 Text messages: {text_count}")
    print(f"📎 Media messages: {media_count}")
    print(f"💾 Saved to: {output_path}")
    print(f"\n🌐 Upload {OUTPUT_JSON} to JDUB Hub website to browse data!")

    await client.disconnect()


def main():
    parser = argparse.ArgumentParser(description='Export Telegram group data')
    parser.add_argument('--api-id', type=int, required=True, help='Telegram API ID')
    parser.add_argument('--api-hash', type=str, required=True, help='Telegram API Hash')
    parser.add_argument('--phone', type=str, required=True, help='Phone number')
    args = parser.parse_args()

    asyncio.run(export_group(args.api_id, args.api_hash, args.phone))


if __name__ == '__main__':
    main()
