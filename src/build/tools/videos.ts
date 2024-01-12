import { isMany, isSingle } from '@francescozoccheddu/ts-goodies/arrays';
import { cerr, err } from '@francescozoccheddu/ts-goodies/errors';
import { BodyVideoSourceInfo } from 'ambagi/pipeline/body';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import ffmpeg, { ffprobe, setFfmpegPath, setFfprobePath } from 'fluent-ffmpeg';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { dirSync } from 'tmp';

export async function extractVideoThumbnail(videoFileOrUrl: Str, time: Num = 0, dev: Bool = false): Promise<Buffer> {
  if (!ffmpegPath) {
    err('No ffmpeg found');
  }
  setFfmpegPath(ffmpegPath);
  const outDir = dirSync();
  try {
    const filename = `${nanoid()}.png`;
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoFileOrUrl, {
        timeout: dev ? 5 : 10,
      })
        .on('end', () => {
          resolve();
        })
        .on('error', () => {
          reject();
        })
        .screenshot({
          timestamps: [time],
          fastSeek: true,
          filename,
          folder: outDir.name,
        });
    });
    return fs.readFileSync(path.join(outDir.name, filename));
  } catch (e) {
    cerr(e, 'Frame extraction failed');
  } finally {
    fs.rmSync(outDir.name, { recursive: true, force: true });
  }
}

function getVideoBaseMimeType(format: Str | Nul): Str {
  if (format?.includes('webm')) {
    return 'webm';
  }
  return 'mp4';
}

export async function getVideoInfo(videoFileOrUrl: Str): Promise<BodyVideoSourceInfo> {
  if (!ffprobePath) {
    err('No ffpropbe found');
  }
  setFfprobePath(ffprobePath);
  try {
    return await new Promise<BodyVideoSourceInfo>((resolve, reject) => {
      const timeoutId = setTimeout(reject, 5 * 1000);
      ffprobe(videoFileOrUrl, (_err, data) => {
        clearTimeout(timeoutId);
        const videoStreams = data.streams.filter(s => s.codec_type === 'video');
        if (!isSingle(videoStreams)) {
          err('Expected a single video stream');
        }
        const audioStreams = data.streams.filter(s => s.codec_type === 'audio');
        if (isMany(audioStreams)) {
          err('Expected no more than a single audio stream');
        }
        const video = videoStreams[0]!;
        const audio = audioStreams[0] ?? null;
        resolve({
          size: data.format.size!,
          type: `video/${getVideoBaseMimeType(data.format.format_name ?? null)}`, // TODO: RFC6831
          width: video.width!,
          height: video.height!,
          audio: audio !== null,
        });
      });
    });
  } catch (e) {
    cerr(e, 'Video probing failed');
  }
}