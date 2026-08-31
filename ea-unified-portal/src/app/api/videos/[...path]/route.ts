import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCS_CREATIVE_BUCKET || 'eagames-ebc-demo-app-creative-assets';
const storage = new Storage();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse('Video path missing', { status: 400 });
  }

  const decodedSegments = pathSegments.map((s) => decodeURIComponent(s));
  const relativePath = decodedSegments.join('/');
  const filename = decodedSegments[decodedSegments.length - 1];

  // 1. Try serving from local public directory if available (dev / bundled mode)
  const localFilePath = path.join(process.cwd(), 'public', 'videos', relativePath);
  if (fs.existsSync(localFilePath)) {
    const stat = fs.statSync(localFilePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(localFilePath, { start, end });
      // Convert node stream to web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/mp4',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } else {
      const fileStream = fs.createReadStream(localFilePath);
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  // 2. Stream directly from Google Cloud Storage bucket (Cloud Run / production mode)
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const gcsObjectPath = `creatives/${relativePath}`;
    const file = bucket.file(gcsObjectPath);

    const [exists] = await file.exists();
    if (!exists) {
      // Try searching for matching file in the subfolder
      const folder = decodedSegments[0];
      const [files] = await bucket.getFiles({ prefix: `creatives/${folder}/` });
      const matched = files.find(
        (f) =>
          f.name.toLowerCase().endsWith(filename.toLowerCase()) ||
          f.name.toLowerCase().includes(filename.toLowerCase())
      );
      if (!matched) {
        return new NextResponse(`Video not found in GCS: ${gcsObjectPath}`, { status: 404 });
      }
      return streamGcsFile(matched, request);
    }

    return streamGcsFile(file, request);
  } catch (error: any) {
    console.error('Error streaming video from GCS:', error);
    return new NextResponse(`Error streaming from GCS: ${error?.message || error}`, {
      status: 500,
    });
  }
}

async function streamGcsFile(file: any, request: NextRequest) {
  const [metadata] = await file.getMetadata();
  const fileSize = parseInt(metadata.size, 10);
  const range = request.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const gcsStream = file.createReadStream({ start, end });
    const webStream = new ReadableStream({
      start(controller) {
        gcsStream.on('data', (chunk: any) => controller.enqueue(chunk));
        gcsStream.on('end', () => controller.close());
        gcsStream.on('error', (err: any) => controller.error(err));
      },
      cancel() {
        gcsStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } else {
    const gcsStream = file.createReadStream();
    const webStream = new ReadableStream({
      start(controller) {
        gcsStream.on('data', (chunk: any) => controller.enqueue(chunk));
        gcsStream.on('end', () => controller.close());
        gcsStream.on('error', (err: any) => controller.error(err));
      },
      cancel() {
        gcsStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
}
